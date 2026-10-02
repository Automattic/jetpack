// packages/components/src/menu/item-help-text.tsx
import { forwardRef, useContext } from "@wordpress/element";
import { Context } from "./context.mjs";
import * as Styled from "./styles.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var ItemHelpText2 = forwardRef(function ItemHelpText3(props, ref) {
  const menuContext = useContext(Context);
  if (!menuContext?.store) {
    throw new Error("Menu.ItemHelpText can only be rendered inside a Menu component");
  }
  return /* @__PURE__ */ _jsx(Styled.ItemHelpText, {
    numberOfLines: 2,
    ref,
    ...props
  });
});
export {
  ItemHelpText2 as ItemHelpText
};
//# sourceMappingURL=item-help-text.mjs.map
