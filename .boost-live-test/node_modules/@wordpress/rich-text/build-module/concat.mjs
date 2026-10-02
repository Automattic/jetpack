// packages/rich-text/src/concat.js
import { normaliseFormats } from "./normalise-formats.mjs";
import { create } from "./create.mjs";
function mergePair(a, b) {
  a.formats = a.formats.concat(b.formats);
  a.replacements = a.replacements.concat(b.replacements);
  a.text += b.text;
  return a;
}
function concat(...values) {
  return normaliseFormats(values.reduce(mergePair, create()));
}
export {
  concat,
  mergePair
};
//# sourceMappingURL=concat.mjs.map
