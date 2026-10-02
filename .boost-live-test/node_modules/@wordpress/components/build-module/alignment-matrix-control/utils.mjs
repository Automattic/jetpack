// packages/components/src/alignment-matrix-control/utils.tsx
import { __ } from "@wordpress/i18n";
var GRID = [["top left", "top center", "top right"], ["center left", "center center", "center right"], ["bottom left", "bottom center", "bottom right"]];
var ALIGNMENT_LABEL = {
  "top left": __("Top Left"),
  "top center": __("Top Center"),
  "top right": __("Top Right"),
  "center left": __("Center Left"),
  "center center": __("Center"),
  center: __("Center"),
  "center right": __("Center Right"),
  "bottom left": __("Bottom Left"),
  "bottom center": __("Bottom Center"),
  "bottom right": __("Bottom Right")
};
var ALIGNMENTS = GRID.flat();
function normalize(value) {
  const normalized = value === "center" ? "center center" : value;
  const transformed = normalized?.replace("-", " ");
  return ALIGNMENTS.includes(transformed) ? transformed : void 0;
}
function getItemId(prefixId, value) {
  const normalized = normalize(value);
  if (!normalized) {
    return;
  }
  const id = normalized.replace(" ", "-");
  return `${prefixId}-${id}`;
}
function getItemValue(prefixId, id) {
  const value = id?.replace(prefixId + "-", "");
  return normalize(value);
}
function getAlignmentIndex(alignment = "center") {
  const normalized = normalize(alignment);
  if (!normalized) {
    return void 0;
  }
  const index = ALIGNMENTS.indexOf(normalized);
  return index > -1 ? index : void 0;
}
export {
  ALIGNMENTS,
  ALIGNMENT_LABEL,
  GRID,
  getAlignmentIndex,
  getItemId,
  getItemValue
};
//# sourceMappingURL=utils.mjs.map
