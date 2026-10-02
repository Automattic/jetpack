// packages/rich-text/src/insert.js
import { create } from "./create.mjs";
import { normaliseFormats } from "./normalise-formats.mjs";
function insert(value, valueToInsert, startIndex = value.start, endIndex = value.end) {
  const { formats, replacements, text } = value;
  if (typeof valueToInsert === "string") {
    valueToInsert = create({ text: valueToInsert });
  }
  const index = startIndex + valueToInsert.text.length;
  return normaliseFormats({
    formats: formats.slice(0, startIndex).concat(valueToInsert.formats, formats.slice(endIndex)),
    replacements: replacements.slice(0, startIndex).concat(
      valueToInsert.replacements,
      replacements.slice(endIndex)
    ),
    text: text.slice(0, startIndex) + valueToInsert.text + text.slice(endIndex),
    start: index,
    end: index
  });
}
export {
  insert
};
//# sourceMappingURL=insert.mjs.map
