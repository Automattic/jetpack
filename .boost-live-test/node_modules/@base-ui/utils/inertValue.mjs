import { isReactVersionAtLeast } from "./reactVersion.mjs";
export function inertValue(value) {
  if (isReactVersionAtLeast(19)) {
    return value;
  }
  // compatibility with React < 19
  return value ? 'true' : undefined;
}