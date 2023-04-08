interface ActionItOptions {
  open_ai_api_key: string;
  max_retries?: number;
}

interface ActionItFunction {
  name: string;
  function: () => void;
  parameters: {
    [key: string]: any;
  };
}

class ActionIt {
  private open_ai_api_key: string;
  private maxRetries: number;

  private functions: ActionItFunction[] = [];

  constructor(options: ActionItOptions) {
    this.open_ai_api_key = options.open_ai_api_key;
    this.maxRetries = options.max_retries ?? 3;
  }

  addFunction(func: ActionItFunction) {
    this.functions.push(func);
  }
}

export default ActionIt;
