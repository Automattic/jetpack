import * as ScrollAreaRootDataAttributes from "./ScrollAreaRootDataAttributes.mjs";
const attr = name => value => value ? {
  [name]: ''
} : null;
export const scrollAreaStateAttributesMapping = {
  hasOverflowX: attr(ScrollAreaRootDataAttributes.hasOverflowX),
  hasOverflowY: attr(ScrollAreaRootDataAttributes.hasOverflowY),
  overflowXStart: attr(ScrollAreaRootDataAttributes.overflowXStart),
  overflowXEnd: attr(ScrollAreaRootDataAttributes.overflowXEnd),
  overflowYStart: attr(ScrollAreaRootDataAttributes.overflowYStart),
  overflowYEnd: attr(ScrollAreaRootDataAttributes.overflowYEnd),
  cornerHidden: () => null
};