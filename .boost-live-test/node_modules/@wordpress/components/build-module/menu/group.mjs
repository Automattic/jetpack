// packages/components/src/menu/group.tsx
import { forwardRef, useContext } from "@wordpress/element";
import { Context } from "./context.mjs";
import * as Styled from "./styles.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var Group2 = forwardRef(function Group3(props, ref) {
  const menuContext = useContext(Context);
  if (!menuContext?.store) {
    throw new Error("Menu.Group can only be rendered inside a Menu component");
  }
  return /* @__PURE__ */ _jsx(Styled.Group, {
    ref,
    ...props,
    store: menuContext.store
  });
});
export {
  Group2 as Group
};
//# sourceMappingURL=group.mjs.map
