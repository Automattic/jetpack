// packages/dom/src/dom/is-rtl.js
import getComputedStyle from "./get-computed-style.mjs";
function isRTL(element) {
  return getComputedStyle(element).direction === "rtl";
}
export {
  isRTL as default
};
//# sourceMappingURL=is-rtl.mjs.map
