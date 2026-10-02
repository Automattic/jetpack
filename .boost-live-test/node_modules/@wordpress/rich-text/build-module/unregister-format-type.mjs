// packages/rich-text/src/unregister-format-type.js
import { select, dispatch } from "@wordpress/data";
import { store as richTextStore } from "./store/index.mjs";
function unregisterFormatType(name) {
  const oldFormat = select(richTextStore).getFormatType(name);
  if (!oldFormat) {
    window.console.error(`Format ${name} is not registered.`);
    return;
  }
  dispatch(richTextStore).removeFormatTypes(name);
  return oldFormat;
}
export {
  unregisterFormatType
};
//# sourceMappingURL=unregister-format-type.mjs.map
