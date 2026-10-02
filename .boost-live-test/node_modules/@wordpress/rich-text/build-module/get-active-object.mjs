// packages/rich-text/src/get-active-object.js
import { OBJECT_REPLACEMENT_CHARACTER } from "./special-characters.mjs";
function getActiveObject({ start, end, replacements, text }) {
  if (start + 1 !== end || text[start] !== OBJECT_REPLACEMENT_CHARACTER) {
    return;
  }
  return replacements[start];
}
export {
  getActiveObject
};
//# sourceMappingURL=get-active-object.mjs.map
