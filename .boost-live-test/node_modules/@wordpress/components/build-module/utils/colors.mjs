// packages/components/src/utils/colors.js
import memoize from "memize";
import { colord, extend } from "colord";
import namesPlugin from "colord/plugins/names";
var colorComputationNode;
extend([namesPlugin]);
function rgba(hexValue = "", alpha = 1) {
  return colord(hexValue).alpha(alpha).toRgbString();
}
function getColorComputationNode() {
  if (typeof document === "undefined") {
    return;
  }
  if (!colorComputationNode) {
    const el = document.createElement("div");
    el.setAttribute("data-g2-color-computation-node", "");
    document.body.appendChild(el);
    colorComputationNode = el;
  }
  return colorComputationNode;
}
function isColor(value) {
  if (typeof value !== "string") {
    return false;
  }
  const test = colord(value);
  return test.isValid();
}
function _getComputedBackgroundColor(backgroundColor) {
  if (typeof backgroundColor !== "string") {
    return "";
  }
  if (isColor(backgroundColor)) {
    return backgroundColor;
  }
  if (!backgroundColor.includes("var(")) {
    return "";
  }
  if (typeof document === "undefined") {
    return "";
  }
  const el = getColorComputationNode();
  if (!el) {
    return "";
  }
  el.style.background = backgroundColor;
  const computedColor = window?.getComputedStyle(el).background;
  el.style.background = "";
  return computedColor || "";
}
var getComputedBackgroundColor = memoize(_getComputedBackgroundColor);
function getOptimalTextColor(backgroundColor) {
  const background = getComputedBackgroundColor(backgroundColor);
  return colord(background).isLight() ? "#000000" : "#ffffff";
}
function getOptimalTextShade(backgroundColor) {
  const result = getOptimalTextColor(backgroundColor);
  return result === "#000000" ? "dark" : "light";
}
export {
  getOptimalTextColor,
  getOptimalTextShade,
  rgba
};
//# sourceMappingURL=colors.mjs.map
