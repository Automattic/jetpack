// packages/components/src/composite/row.tsx
import * as Ariakit from "@ariakit/react";
import { forwardRef } from "@wordpress/element";
import { useCompositeContext } from "./context.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var CompositeRow2 = forwardRef(function CompositeRow3(props, ref) {
  const context = useCompositeContext();
  const store = props.store ?? context.store;
  return /* @__PURE__ */ _jsx(Ariakit.CompositeRow, {
    store,
    ...props,
    ref
  });
});
export {
  CompositeRow2 as CompositeRow
};
//# sourceMappingURL=row.mjs.map
