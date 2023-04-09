import { ChatCompletionRequestMessage } from "openai";
import OpenAIWrapper from "./llms/openai";
import { getChooseFunctionPrompt, getSystemPrompt } from "./llms/prompts";
import { isAsync } from "./utils/functions";

interface AnyFunction {
  (...args: any[]): any;
}

interface HandleResponseFunction {
  (inputString: string): void;
}

interface ActionItOptions {
  open_ai_api_key: string;
  max_retries?: number;
  on_response: HandleResponseFunction;
}

export interface ActionItFunction {
  name: string;
  function: AnyFunction;
  description: string;
  parameters: {
    [key: string]: any;
  };
}

interface FunctionExecutor {
  name: string;
  parameters: {
    [key: string]: any;
  };
}

interface LlmResponseJson {
  followUpQuestion?: string;
  functionExecutor?: FunctionExecutor;
}

class ActionIt {
  private openAiApiKey: string;
  private maxRetries: number;
  private openAIWrapper: OpenAIWrapper;
  private onResponseFn: HandleResponseFunction;

  private functionMap: { [key: string]: ActionItFunction } = {};

  private systemPrompt = getSystemPrompt();

  constructor(options: ActionItOptions) {
    if (!options.open_ai_api_key) {
      throw new Error("Missing open_ai_api_key");
    }

    this.openAiApiKey = options.open_ai_api_key;
    this.maxRetries = options.max_retries ?? 3;
    this.onResponseFn = options.on_response;

    this.openAIWrapper = new OpenAIWrapper({
      open_ai_api_key: this.openAiApiKey,
      max_retries: this.maxRetries,
    });
  }

  addFunction(func: ActionItFunction) {
    if (func.name) {
      if (this.functionMap.hasOwnProperty(func.name)) {
        this.functionMap[func.name + "2"] = func;
      } else {
        this.functionMap[func.name] = func;
      }
    } else {
      console.warn("ActionIt addFunction - function missing name");
    }
  }

  private async chooseAndExecuteFunction(executorOptions: FunctionExecutor) {
    const functionName = executorOptions.name;
    const params = executorOptions.parameters;

    if (!this.functionMap.hasOwnProperty(functionName))
      throw new Error("Function not found");

    const selectedFunction = this.functionMap[functionName];

    if (isAsync(selectedFunction.function)) {
      await selectedFunction.function(params);
    } else {
      selectedFunction.function(params);
    }
  }

  private handleLlmResponse(response: string): LlmResponseJson {
    let jsonResponse;

    try {
      jsonResponse = JSON.parse(response);
    } catch {
      const regex = /{[^{}]+}/;

      const extractedJsonString = response.match(regex);

      if (extractedJsonString && extractedJsonString.length) {
        jsonResponse = JSON.parse(extractedJsonString[0]);
      }
    }

    if (jsonResponse.hasOwnProperty("function_name")) {
      return {
        functionExecutor: {
          name: jsonResponse.function_name,
          parameters: jsonResponse.parameters,
        },
      };
    } else if (jsonResponse.hasOwnProperty("question_response")) {
      return {
        followUpQuestion: jsonResponse.question_response,
      };
    }

    throw new Error("Missing function or question response from LLM");
  }

  async handleNewInput(singleUserMessage: string) {
    const userContent = getChooseFunctionPrompt({
      isRetry: false,
      query: singleUserMessage,
      functions: Object.values(this.functionMap),
    });

    const userMessage: ChatCompletionRequestMessage = {
      role: "user",
      content: userContent,
    };

    const completitionResponse =
      await this.openAIWrapper.createChatRequestWithRetry({
        systemPrompt: this.systemPrompt,
        messages: [userMessage],
      });

    const completitionResponseJson =
      this.handleLlmResponse(completitionResponse);

    if (completitionResponseJson.followUpQuestion) {
      this.onResponseFn(completitionResponseJson.followUpQuestion);
    } else if (completitionResponseJson.functionExecutor) {
      const functionExector: FunctionExecutor =
        completitionResponseJson.functionExecutor;

      this.onResponseFn(
        `Going to try and execute function: ${functionExector.name}`
      );

      if (this.functionMap.hasOwnProperty(functionExector.name)) {
        await this.chooseAndExecuteFunction(functionExector);

        this.onResponseFn(`Function: ${functionExector.name} was executed.`);
      }
    } else {
      this.onResponseFn("Sorry something went wrong, can you try again?");
    }
  }
}

export default ActionIt;
