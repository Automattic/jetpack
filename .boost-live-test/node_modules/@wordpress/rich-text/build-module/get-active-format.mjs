// packages/rich-text/src/get-active-format.js
import { getActiveFormats } from "./get-active-formats.mjs";
function getActiveFormat(value, formatType) {
  return getActiveFormats(value).find(
    ({ type }) => type === formatType
  );
}
export {
  getActiveFormat
};
//# sourceMappingURL=get-active-format.mjs.map
