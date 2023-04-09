import { ChatCompletionRequestMessage } from "openai";
import { encoding_for_model } from "@dqbd/tiktoken";

function numTokensFromMessages(
  messages: ChatCompletionRequestMessage[],
  model = "gpt-3.5-turbo"
): number {
  if (model === "gpt-3.5-turbo") {
    const encoding = encoding_for_model(model);

    let numTokens = 0;

    for (const message of messages) {
      // every message follows <im_start>{role/name}\n{content}<im_end>\n
      numTokens += 4;
      for (const [key, value] of Object.entries(message)) {
        numTokens += encoding.encode(value).length;
        // if there's a name, the role is omitted
        if (key === "name") {
          // role is always required and always 1 token
          numTokens += -1;
        }
      }
    }
    numTokens += 2; // every reply is primed with <im_start>assistant

    return numTokens;
  } else {
    throw new Error(
      `numTokensFromMessages() is not presently implemented for model ${model}.`
    );
  }
}

export function getMaxMessageSubset(
  messages: ChatCompletionRequestMessage[],
  systemPrompt: ChatCompletionRequestMessage,
  maxTokens: number,
  maxTokenWindowSize = 4096
): ChatCompletionRequestMessage[] {
  let currentTokens = numTokensFromMessages([systemPrompt]);
  let endIndex = messages.length;

  for (let i = messages.length - 1; i >= 0; i--) {
    currentTokens += numTokensFromMessages([messages[i]]);
    if (currentTokens + maxTokens <= maxTokenWindowSize) {
      endIndex = i;
      break;
    }
  }

  return messages.slice(endIndex);
}
