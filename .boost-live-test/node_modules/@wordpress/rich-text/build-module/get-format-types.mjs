// packages/rich-text/src/get-format-types.js
import { select } from "@wordpress/data";
import { store as richTextStore } from "./store/index.mjs";
function getFormatTypes() {
  return select(richTextStore).getFormatTypes();
}
export {
  getFormatTypes
};
//# sourceMappingURL=get-format-types.mjs.map
