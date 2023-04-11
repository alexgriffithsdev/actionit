export function isAsync(fn: (...args: any[]) => any): boolean {
  const fnStr = fn.toString().trim();
  return !!(
    fnStr.startsWith("async ") || // async function declaration
    fnStr.includes(" async ") || // async function expression
    fnStr.endsWith("AsyncFunction}")
  ); // AsyncFunction constructor
}
