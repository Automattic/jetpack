// packages/components/src/composite/typeahead.tsx
import * as Ariakit from "@ariakit/react";
import { forwardRef } from "@wordpress/element";
import { useCompositeContext } from "./context.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
var CompositeTypeahead2 = forwardRef(function CompositeTypeahead3(props, ref) {
  const context = useCompositeContext();
  const store = props.store ?? context.store;
  return /* @__PURE__ */ _jsx(Ariakit.CompositeTypeahead, {
    store,
    ...props,
    ref
  });
});
export {
  CompositeTypeahead2 as CompositeTypeahead
};
//# sourceMappingURL=typeahead.mjs.map
