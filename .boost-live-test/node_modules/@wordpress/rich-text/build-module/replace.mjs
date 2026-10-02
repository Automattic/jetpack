// packages/rich-text/src/replace.js
import { normaliseFormats } from "./normalise-formats.mjs";
function replace({ formats, replacements, text, start, end }, pattern, replacement) {
  text = text.replace(pattern, (match, ...rest) => {
    const offset = rest[rest.length - 2];
    let newText = replacement;
    let newFormats;
    let newReplacements;
    if (typeof newText === "function") {
      newText = replacement(match, ...rest);
    }
    if (typeof newText === "object") {
      newFormats = newText.formats;
      newReplacements = newText.replacements;
      newText = newText.text;
    } else {
      newFormats = Array(newText.length);
      newReplacements = Array(newText.length);
      if (formats[offset]) {
        newFormats = newFormats.fill(formats[offset]);
      }
    }
    formats = formats.slice(0, offset).concat(newFormats, formats.slice(offset + match.length));
    replacements = replacements.slice(0, offset).concat(
      newReplacements,
      replacements.slice(offset + match.length)
    );
    if (start) {
      start = end = offset + newText.length;
    }
    return newText;
  });
  return normaliseFormats({ formats, replacements, text, start, end });
}
export {
  replace
};
//# sourceMappingURL=replace.mjs.map
