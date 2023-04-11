interface AnyFunction {
  (...args: any[]): any;
}

export interface HandleResponseFunction {
  (inputString: string): void;
}

export interface ActionItOptions {
  open_ai_api_key: string;
  max_retries?: number;
  on_response: HandleResponseFunction;
}

export interface ActionItFunction {
  name: string;
  function: AnyFunction;
  description: string;
  parameters?: {
    [key: string]: any;
  };
}

export interface FunctionExecutor {
  name: string;
  parameters?: {
    [key: string]: any;
  };
}

export interface LlmResponseJson {
  followUpQuestion?: string;
  functionExecutor?: FunctionExecutor;
}
