import { type ChatCompletionRequestMessage } from "openai";
import OpenAIWrapper from "./llms/openai";
import { getChooseFunctionPrompt, getSystemPrompt } from "./llms/prompts";
import { isAsync } from "./utils/functions";
import {
  type HandleResponseFunction,
  type ActionItFunction,
  type ActionItOptions,
  type FunctionExecutor,
  type LlmResponseJson,
  type UserAssistantAndClientMessageArray,
} from "./actionItTypes";

class ActionIt {
  private readonly openAiApiKey: string;

  private readonly maxRetries: number;

  private readonly openAIWrapper: OpenAIWrapper;

  private readonly onResponseFn: HandleResponseFunction;

  private functionMap: Record<string, ActionItFunction> = {};

  private readonly systemPrompt = getSystemPrompt();

  constructor(options: ActionItOptions) {
    if (
      options.open_ai_api_key === undefined ||
      options.open_ai_api_key === ""
    ) {
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

  addFunction(func: ActionItFunction): void {
    if (func.name !== undefined && func.name !== "") {
      if (Object.prototype.hasOwnProperty.call(this.functionMap, func.name)) {
        this.functionMap[func.name + "2"] = func;
      } else {
        this.functionMap[func.name] = func;
      }
    } else {
      console.warn("ActionIt addFunction - function missing name");
    }
  }

  private async chooseAndExecuteFunction(
    executorOptions: FunctionExecutor
  ): Promise<{ success: boolean; error?: string }> {
    const functionName = executorOptions.name;
    const params = executorOptions.parameters;

    if (!Object.prototype.hasOwnProperty.call(this.functionMap, functionName))
      throw new Error("Function not found");

    const selectedFunction = this.functionMap[functionName];

    try {
      if (isAsync(selectedFunction.function)) {
        await selectedFunction.function(params);
      } else {
        selectedFunction.function(params);
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private handleLlmResponse(response: string): LlmResponseJson {
    let jsonResponse;

    try {
      jsonResponse = JSON.parse(response);
    } catch {
      const regex = /{[^{}]+}/;

      const extractedJsonString = response.match(regex);

      if (extractedJsonString != null && extractedJsonString.length > 0) {
        jsonResponse = JSON.parse(extractedJsonString[0]);
      }
    }

    if (Object.prototype.hasOwnProperty.call(jsonResponse, "function_name")) {
      return {
        functionExecutor: {
          name: jsonResponse.function_name,
          parameters: jsonResponse.parameters,
        },
      };
    } else if (
      Object.prototype.hasOwnProperty.call(jsonResponse, "follow_up_question")
    ) {
      return {
        followUpQuestion: jsonResponse.follow_up_question,
      };
    }

    throw new Error("Missing function or question response from LLM");
  }

  private async getAndHandleCompletitionResponse({
    userMessage,
    prevMessages,
  }: {
    userMessage: ChatCompletionRequestMessage;
    prevMessages?: ChatCompletionRequestMessage[];
  }): Promise<UserAssistantAndClientMessageArray> {
    let responseMessage: string = "";
    const completitionResponse =
      await this.openAIWrapper.createChatRequestWithRetry({
        systemPrompt: this.systemPrompt,
        messages:
          prevMessages != null ? [...prevMessages, userMessage] : [userMessage],
      });

    const completitionResponseJson =
      this.handleLlmResponse(completitionResponse);

    if (completitionResponseJson.followUpQuestion != null) {
      if (this.onResponseFn != null) {
        responseMessage = completitionResponseJson.followUpQuestion;
        this.onResponseFn(completitionResponseJson.followUpQuestion);
      }
    } else if (completitionResponseJson.functionExecutor != null) {
      const functionExector: FunctionExecutor =
        completitionResponseJson.functionExecutor;

      if (this.onResponseFn != null) {
        const execMessage = `Going to try and execute function: ${functionExector.name}`;
        responseMessage = execMessage;
        this.onResponseFn(execMessage);
      }

      if (
        Object.prototype.hasOwnProperty.call(
          this.functionMap,
          functionExector.name
        )
      ) {
        const { success } = await this.chooseAndExecuteFunction(
          functionExector
        );

        if (success) {
          if (this.onResponseFn != null) {
            const execCompleteMessage = `Function: ${functionExector.name} was executed.`;

            responseMessage = execCompleteMessage;
            this.onResponseFn(execCompleteMessage);
          }
        } else {
          // Retry logic
        }
      }
    } else {
      if (this.onResponseFn != null) {
        const errorMessage = "Sorry something went wrong, can you try again?";

        responseMessage = errorMessage;
        this.onResponseFn(errorMessage);
      }
    }

    return [
      userMessage,
      { role: "assistant", content: completitionResponse },
      responseMessage,
    ];
  }

  async handleMessagesInput(
    prevMessages: ChatCompletionRequestMessage[],
    singleUserMessage: string,
    state?: string
  ): Promise<UserAssistantAndClientMessageArray> {
    const userContent = getChooseFunctionPrompt({
      isRetry: false,
      query: singleUserMessage,
      functions: Object.values(this.functionMap),
      state,
    });

    const userMessage: ChatCompletionRequestMessage = {
      role: "user",
      content: userContent,
    };

    return await this.getAndHandleCompletitionResponse({
      userMessage,
      prevMessages,
    });
  }

  async handleSingleInput(
    singleUserMessage: string,
    state?: string
  ): Promise<UserAssistantAndClientMessageArray> {
    const userContent = getChooseFunctionPrompt({
      isRetry: false,
      query: singleUserMessage,
      functions: Object.values(this.functionMap),
      state,
    });

    const userMessage: ChatCompletionRequestMessage = {
      role: "user",
      content: userContent,
    };

    return await this.getAndHandleCompletitionResponse({ userMessage });
  }
}

export default ActionIt;
