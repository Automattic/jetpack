// packages/components/src/text/get-line-height.ts
import { space } from "../utils/space.mjs";
import { CONFIG } from "../utils/index.mjs";
function getLineHeight(adjustLineHeightForInnerControls, lineHeight) {
  if (lineHeight) {
    return lineHeight;
  }
  if (!adjustLineHeightForInnerControls) {
    return;
  }
  let value = `calc(${CONFIG.controlHeight} + ${space(2)})`;
  switch (adjustLineHeightForInnerControls) {
    case "large":
      value = `calc(${CONFIG.controlHeightLarge} + ${space(2)})`;
      break;
    case "small":
      value = `calc(${CONFIG.controlHeightSmall} + ${space(2)})`;
      break;
    case "xSmall":
      value = `calc(${CONFIG.controlHeightXSmall} + ${space(2)})`;
      break;
    default:
      break;
  }
  return value;
}
export {
  getLineHeight
};
//# sourceMappingURL=get-line-height.mjs.map
