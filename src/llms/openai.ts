import {
  Configuration,
  OpenAIApi,
  CreateChatCompletionResponse,
  ChatCompletionRequestMessage,
} from "openai";
import { AxiosRequestConfig } from "axios";

interface OpenAIWrapperOptions {
  open_ai_api_key: string;
  model: string;
  max_tokens?: number;
  max_retries: number;
  messages: [ChatCompletionRequestMessage];
}

class OpenAIWrapper {
  private openai: OpenAIApi;
  private maxTokens: number;
  private model: string;
  private maxRetries: number;
  private messages: [ChatCompletionRequestMessage];

  constructor(options: OpenAIWrapperOptions) {
    const configuration = new Configuration({
      apiKey: options.open_ai_api_key,
    });
    this.openai = new OpenAIApi(configuration);

    this.maxTokens = options.max_tokens ?? 250;
    this.model = options.model;
    this.maxRetries = options.max_retries;
    this.messages = options.messages;
  }

  async createChatRequestWithRetry(): Promise<string> {
    const makeRequest = async (retries: number = 0): Promise<string> => {
      try {
        const chatCompletion = await this.createChatCompletion();

        return chatCompletion;
      } catch (error: any) {
        const status = error.response ? error.response.status : null;

        if (retries < this.maxRetries && status === 429) {
          const timeToWait = Math.pow(2, retries) * 1000;
          await new Promise((resolve) => setTimeout(resolve, timeToWait));

          return makeRequest(retries + 1);
        } else {
          throw error;
        }
      }
    };

    return makeRequest();
  }

  private async createChatCompletion(
    requestOptions?: AxiosRequestConfig
  ): Promise<string> {
    try {
      const response = await this.openai.createChatCompletion(
        {
          model: this.model,
          messages: this.messages,
          max_tokens: this.maxTokens,
        },
        requestOptions
      );
      const answer = response.data as CreateChatCompletionResponse;
      return answer.choices[0]?.message?.content || "";
    } catch (error: any) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
      throw error;
    }
  }
}

export default OpenAIWrapper;
