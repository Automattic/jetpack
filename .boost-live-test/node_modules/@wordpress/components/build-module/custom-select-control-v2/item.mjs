// packages/components/src/custom-select-control-v2/item.tsx
import { useContext } from "@wordpress/element";
import { Icon, check } from "@wordpress/icons";
import * as Styled from "./styles.mjs";
import { CustomSelectContext } from "./custom-select.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function CustomSelectItem({
  children,
  ...props
}) {
  const customSelectContext = useContext(CustomSelectContext);
  return /* @__PURE__ */ _jsxs(Styled.SelectItem, {
    store: customSelectContext?.store,
    size: customSelectContext?.size ?? "default",
    ...props,
    children: [children ?? props.value, /* @__PURE__ */ _jsx(Styled.SelectedItemCheck, {
      children: /* @__PURE__ */ _jsx(Icon, {
        icon: check
      })
    })]
  });
}
CustomSelectItem.displayName = "CustomSelectControlV2.Item";
var item_default = CustomSelectItem;
export {
  CustomSelectItem,
  item_default as default
};
//# sourceMappingURL=item.mjs.map
