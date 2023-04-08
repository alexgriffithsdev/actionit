import { ActionItFunction } from "../actionIt";

interface FunctionSelectorPromptGeneratorOptions {
  isRetry?: Boolean;
  functions: ActionItFunction[];
  query: string;
}

const systemPrompt = `You are a helpful function selector. Given a list of function names and descriptions, you will select one based on a user's input. Each function has a list of parameters and their types which you should also complete based on the user's input. Your response will be in JSON in the format { function_name: "", parameters: {} }. You will return JSON only.`;

class FunctionSelectorPromptGenerator {
  private functions: ActionItFunction[] = [];
  private isRetry: Boolean;
  private query: string;

  constructor(options: FunctionSelectorPromptGeneratorOptions) {
    this.functions = options.functions;
    this.isRetry = options.isRetry ?? false;
    this.query = options.query;
  }

  getSystemPrompt(): string {
    return systemPrompt;
  }

  getChooseFunctionPrompt(): string {
    let prompt = this.isRetry
      ? "Sorry, that didn't work, can you try again please.\nFunctions:"
      : "Functions:";

    this.functions.forEach((fn) => {
      prompt += `\nName: ${fn.name}`;
      prompt += `\nDescription: ${fn.description}`;
      prompt += `\nParameters: ${JSON.stringify(fn.parameters)}`;
      prompt += "\n";
    });

    prompt += `User input: ${this.query}\n`;
    prompt += "Function JSON:";

    return prompt;
  }
}
