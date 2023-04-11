type AnyFunction = (...args: any[]) => any;

export type HandleResponseFunction = (inputString: string) => void;

export interface ActionItOptions {
  open_ai_api_key: string;
  max_retries?: number;
  on_response: HandleResponseFunction;
}

export interface ActionItFunction {
  name: string;
  function: AnyFunction;
  description: string;
  parameters?: Record<string, any>;
}

export interface FunctionExecutor {
  name: string;
  parameters?: Record<string, any>;
}

export interface LlmResponseJson {
  followUpQuestion?: string;
  functionExecutor?: FunctionExecutor;
}
