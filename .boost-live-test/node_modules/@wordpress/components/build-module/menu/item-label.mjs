// packages/components/src/menu/item-label.tsx
import { forwardRef, useContext } from "@wordpress/element";
import { Context } from "./context.mjs";
import * as Styled from "./styles.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var ItemLabel2 = forwardRef(function ItemLabel3(props, ref) {
  const menuContext = useContext(Context);
  if (!menuContext?.store) {
    throw new Error("Menu.ItemLabel can only be rendered inside a Menu component");
  }
  return /* @__PURE__ */ _jsx(Styled.ItemLabel, {
    numberOfLines: 1,
    ref,
    ...props
  });
});
export {
  ItemLabel2 as ItemLabel
};
//# sourceMappingURL=item-label.mjs.map
