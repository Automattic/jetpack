// packages/rich-text/src/get-format-type.js
import { select } from "@wordpress/data";
import { store as richTextStore } from "./store/index.mjs";
function getFormatType(name) {
  return select(richTextStore).getFormatType(name);
}
export {
  getFormatType
};
//# sourceMappingURL=get-format-type.mjs.map
