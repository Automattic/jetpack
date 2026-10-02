// packages/redux-routine/src/is-action.ts
import { isPlainObject } from "is-plain-object";
function isAction(object) {
  return isPlainObject(object) && typeof object.type === "string";
}
function isActionOfType(object, expectedType) {
  return isAction(object) && object.type === expectedType;
}
export {
  isAction,
  isActionOfType
};
//# sourceMappingURL=is-action.mjs.map
