// packages/rich-text/src/remove.js
import { insert } from "./insert.mjs";
import { create } from "./create.mjs";
function remove(value, startIndex, endIndex) {
  return insert(value, create(), startIndex, endIndex);
}
export {
  remove
};
//# sourceMappingURL=remove.mjs.map
