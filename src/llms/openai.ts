import {
  Configuration,
  OpenAIApi,
  CreateChatCompletionResponse,
  ChatCompletionRequestMessage,
} from "openai";
import { getMaxMessageSubset } from "../utils/tokenLimits";
import { gptTurboTokenLimit } from "../constants/maxTokenLimits";

interface OpenAIWrapperOptions {
  open_ai_api_key: string;
  max_tokens?: number;
  max_retries: number;
}

class OpenAIWrapper {
  private openai: OpenAIApi;
  private maxTokens: number;
  private maxRetries: number;

  constructor(options: OpenAIWrapperOptions) {
    const configuration = new Configuration({
      apiKey: options.open_ai_api_key,
    });
    this.openai = new OpenAIApi(configuration);

    this.maxTokens = options.max_tokens ?? 250;
    this.maxRetries = options.max_retries;
  }

  async createChatRequestWithRetry({
    systemPrompt,
    messages,
  }: {
    systemPrompt: string;
    messages: ChatCompletionRequestMessage[];
  }): Promise<string> {
    const makeRequest = async (retries: number = 0): Promise<string> => {
      try {
        const chatCompletion = await this.createChatCompletion(
          systemPrompt,
          messages
        );

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
    systemPrompt: string,
    messages: ChatCompletionRequestMessage[]
  ): Promise<string> {
    try {
      const messagesSubset = getMaxMessageSubset(
        messages,
        { role: "system", content: systemPrompt },
        this.maxTokens,
        gptTurboTokenLimit
      );

      if (messagesSubset.length < 2) {
        throw new Error(
          "Messages exceeds the token window - only the system prompt can fit"
        );
      }

      const response = await this.openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: messagesSubset,
        max_tokens: this.maxTokens,
        temperature: 0.5,
      });
      const answer = response.data as CreateChatCompletionResponse;

      const answerString = answer.choices[0]?.message?.content || "";
      // this.messages.push({ role: "assistant", content: answerString });

      return answerString;
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
