// packages/rich-text/src/insert-object.js
import { insert } from "./insert.mjs";
import { OBJECT_REPLACEMENT_CHARACTER } from "./special-characters.mjs";
function insertObject(value, formatToInsert, startIndex, endIndex) {
  const valueToInsert = {
    formats: [,],
    replacements: [formatToInsert],
    text: OBJECT_REPLACEMENT_CHARACTER
  };
  return insert(value, valueToInsert, startIndex, endIndex);
}
export {
  insertObject
};
//# sourceMappingURL=insert-object.mjs.map
