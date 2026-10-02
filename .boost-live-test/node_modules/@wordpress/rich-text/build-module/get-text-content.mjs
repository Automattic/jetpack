// packages/rich-text/src/get-text-content.js
import { OBJECT_REPLACEMENT_CHARACTER } from "./special-characters.mjs";
function getTextContent({ text }) {
  return text.replace(OBJECT_REPLACEMENT_CHARACTER, "");
}
export {
  getTextContent
};
//# sourceMappingURL=get-text-content.mjs.map
