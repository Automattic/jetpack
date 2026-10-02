// packages/components/src/composite/hover.tsx
import * as Ariakit from "@ariakit/react";
import { forwardRef } from "@wordpress/element";
import { useCompositeContext } from "./context.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var CompositeHover2 = forwardRef(function CompositeHover3(props, ref) {
  const context = useCompositeContext();
  const store = props.store ?? context.store;
  return /* @__PURE__ */ _jsx(Ariakit.CompositeHover, {
    store,
    ...props,
    ref
  });
});
export {
  CompositeHover2 as CompositeHover
};
//# sourceMappingURL=hover.mjs.map
