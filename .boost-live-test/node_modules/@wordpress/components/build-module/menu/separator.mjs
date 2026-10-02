// packages/components/src/menu/separator.tsx
import { forwardRef, useContext } from "@wordpress/element";
import { Context } from "./context.mjs";
import * as Styled from "./styles.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var Separator2 = forwardRef(function Separator3(props, ref) {
  const menuContext = useContext(Context);
  if (!menuContext?.store) {
    throw new Error("Menu.Separator can only be rendered inside a Menu component");
  }
  return /* @__PURE__ */ _jsx(Styled.Separator, {
    ref,
    ...props,
    store: menuContext.store,
    variant: menuContext.variant
  });
});
export {
  Separator2 as Separator
};
//# sourceMappingURL=separator.mjs.map
