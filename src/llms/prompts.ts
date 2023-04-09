import { ActionItFunction } from "../actionIt";

const systemPrompt = `You are a helpful function selector.
Given a list of function names and descriptions, you will select one based on a user's input or ask a follow up question.
Each function has a list of parameters and their types which you should also complete based on the user's input. 

Your response will be in JSON. You will return JSON only.

When responding, please use of these 2 formats:

**Format 1**
Use this if you can select a function from the user's input, JSON:
{ function_name: "", parameters: {} }

**Format 2**
Use this if you need to ask the user a question to get more details about what function to choose, JSON:
{ question_response: "" }`;

export function getSystemPrompt(): string {
  return systemPrompt;
}

export function getChooseFunctionPrompt({
  isRetry,
  query,
  functions,
}: {
  isRetry: Boolean;
  query: string;
  functions: ActionItFunction[];
}): string {
  let prompt = isRetry
    ? "Sorry, that didn't work, can you try again please.\nFunctions:"
    : "Functions:";

  functions.forEach((fn) => {
    prompt += `\nName: ${fn.name}`;
    prompt += `\nDescription: ${fn.description}`;
    prompt += `\nParameters: ${JSON.stringify(fn.parameters)}`;
    prompt += "\n";
  });

  prompt += `User input: ${query}\n`;
  prompt += "Function JSON:";

  return prompt;
}
