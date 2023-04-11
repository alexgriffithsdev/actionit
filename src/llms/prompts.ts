import { type ActionItFunction } from "../actionItTypes";
import { numTokensFromString } from "../utils/tokenLimits";

const systemPrompt = `Assistant is a helpful function selector.
Today's date is ${new Date().toDateString()}.
Given a list of javascript function names and descriptions, assistant will engage in conversation with the user to determine which function to select.
A user may also supply some existing state to help you make your decision.
Each function has a list of parameters and their types which assistant should also complete based on the user's input.
Some parameters may be required, so if assistant can't fill them based on the user's input, assistant should ask for the necessary information in the follow_up_question field. 

Assistant's response will be in JSON. You will return JSON only.

When responding, please output a response in one of these two formats only:

**Format 1**
Use this if you can select a function from the user's input and complete all required parameters, JSON:

{ "function_name": "", "parameters": {} }

**Format 2**
Use this if you need to ask the user a question to get more details about what function to choose or any required parameters you need to know, JSON:

{ "follow_up_question": "" }`;

export function getSystemPrompt(): string {
  return systemPrompt;
}

export function getChooseFunctionPrompt({
  isRetry,
  query,
  functions,
  state,
}: {
  isRetry: boolean;
  query: string;
  functions: ActionItFunction[];
  state?: string;
}): string {
  let prompt = isRetry
    ? "Sorry, that didn't work, can you try again please.\nFunctions:"
    : "Functions:";

  // Hard-coded arbitrary limit for function string token length
  // Change in future
  let totalTokens = 2000;

  functions.forEach((fn) => {
    let functionPrompt = `\nName: ${fn.name}`;
    functionPrompt += `\nDescription: ${fn.description}`;
    functionPrompt += `\nDefinition: ${fn.name}({ ${
      fn.parameters != null ? Object.keys(fn.parameters).join(", ") : ""
    } })`;

    if (fn.parameters != null) {
      functionPrompt += `\nParameters: ${Object.keys(fn.parameters)
        .map((paramName: string) => {
          const param = fn.parameters != null ? fn.parameters[paramName] : {};
          const isRequired: string = (param.required as boolean)
            ? "required"
            : "optional";
          const paramType: string = param.type !== undefined ? param.type : "";

          return `\n- ${paramName} (${isRequired}): ${paramType}`;
        })
        .join("")}`;
    }

    functionPrompt += "\n";

    totalTokens -= numTokensFromString(functionPrompt);

    if (totalTokens >= 0) prompt += functionPrompt;
  });

  if (state != null) {
    prompt += `\nState: ${state}\n`;
  }

  prompt += `User input: ${query}\n`;
  prompt += "JSON:";

  return prompt;
}
