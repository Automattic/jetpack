// packages/components/src/tree-grid/item.tsx
import { forwardRef } from "@wordpress/element";
import RovingTabIndexItem from "./roving-tab-index-item.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnforwardedTreeGridItem({
  children,
  ...props
}, ref) {
  return /* @__PURE__ */ _jsx(RovingTabIndexItem, {
    ref,
    ...props,
    children
  });
}
var TreeGridItem = forwardRef(UnforwardedTreeGridItem);
TreeGridItem.displayName = "TreeGridItem";
var item_default = TreeGridItem;
export {
  TreeGridItem,
  item_default as default
};
//# sourceMappingURL=item.mjs.map
