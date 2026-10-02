// packages/rich-text/src/join.js
import { create } from "./create.mjs";
import { normaliseFormats } from "./normalise-formats.mjs";
function join(values, separator = "") {
  if (typeof separator === "string") {
    separator = create({ text: separator });
  }
  return normaliseFormats(
    values.reduce((accumulator, { formats, replacements, text }) => ({
      formats: accumulator.formats.concat(separator.formats, formats),
      replacements: accumulator.replacements.concat(
        separator.replacements,
        replacements
      ),
      text: accumulator.text + separator.text + text
    }))
  );
}
export {
  join
};
//# sourceMappingURL=join.mjs.map
