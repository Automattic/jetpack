// packages/components/src/disclosure/index.tsx
import * as Ariakit from "@ariakit/react";
import { forwardRef } from "@wordpress/element";
import { jsx as _jsx } from "react/jsx-runtime";
var UnforwardedDisclosureContent = ({
  visible,
  children,
  ...props
}, ref) => {
  const disclosure = Ariakit.useDisclosureStore({
    open: visible
  });
  return /* @__PURE__ */ _jsx(Ariakit.DisclosureContent, {
    store: disclosure,
    ref,
    ...props,
    children
  });
};
var DisclosureContent2 = forwardRef(UnforwardedDisclosureContent);
DisclosureContent2.displayName = "DisclosureContent";
var disclosure_default = DisclosureContent2;
export {
  DisclosureContent2 as DisclosureContent,
  disclosure_default as default
};
//# sourceMappingURL=index.mjs.map
