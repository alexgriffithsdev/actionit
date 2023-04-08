import OpenAIWrapper from "./llms/openai";
import { getChooseFunctionPrompt, getSystemPrompt } from "./llms/prompts";
import { isAsync } from "./utils/functions";

interface ActionItOptions {
  open_ai_api_key: string;
  max_retries?: number;
}

interface AnyFunction {
  (...args: any[]): any;
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

class ActionIt {
  private openAiApiKey: string;
  private maxRetries: number;
  private openAIWrapper: OpenAIWrapper;

  private functionMap: { [key: string]: ActionItFunction } = {};

  private systemPrompt = getSystemPrompt();

  constructor(options: ActionItOptions) {
    if (!options.open_ai_api_key) {
      throw new Error("Missing open_ai_api_key");
    }

    this.openAiApiKey = options.open_ai_api_key;
    this.maxRetries = options.max_retries ?? 3;
    this.openAIWrapper = new OpenAIWrapper({
      open_ai_api_key: this.openAiApiKey,
      max_retries: this.maxRetries,
      messages: [],
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

    if (!this.functionMap.hasOwnProperty(functionName)) {
      // Make retry request
    } else {
      const selectedFunction = this.functionMap[functionName];

      if (isAsync(selectedFunction.function)) {
        await selectedFunction.function(params);
      } else {
        selectedFunction.function(params);
      }
    }
  }

  private getFunctionNameAndParamsFromResponse(
    response: string
  ): FunctionExecutor {
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

    return {
      name: jsonResponse.function_name,
      parameters: jsonResponse.parameters,
    };
  }

  async handleNewInput(newInput: string) {
    const userContent = getChooseFunctionPrompt({
      isRetry: false,
      query: newInput,
      functions: Object.values(this.functionMap),
    });

    this.openAIWrapper.addNewUserMessage({
      role: "user",
      content: userContent,
    });
    const completitionResponse =
      await this.openAIWrapper.createChatRequestWithRetry({
        systemPrompt: this.systemPrompt,
      });

    const functionExector =
      this.getFunctionNameAndParamsFromResponse(completitionResponse);

    await this.chooseAndExecuteFunction(functionExector);
  }
}

export default ActionIt;
