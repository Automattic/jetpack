import { createLogOnce } from "./createLogOnce.mjs";
export const warn = createLogOnce('warn', 'Base UI');
export { reset } from "./createLogOnce.mjs";