// packages/components/src/toolbar/toolbar/toolbar-container.tsx
import * as Ariakit from "@ariakit/react";
import { forwardRef } from "@wordpress/element";
import { isRTL } from "@wordpress/i18n";
import ToolbarContext from "../toolbar-context/index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnforwardedToolbarContainer({
  label,
  ...props
}, ref) {
  const toolbarStore = Ariakit.useToolbarStore({
    focusLoop: true,
    rtl: isRTL()
  });
  return (
    // This will provide state for `ToolbarButton`'s
    /* @__PURE__ */ _jsx(ToolbarContext.Provider, {
      value: toolbarStore,
      children: /* @__PURE__ */ _jsx(Ariakit.Toolbar, {
        ref,
        "aria-label": label,
        store: toolbarStore,
        ...props
      })
    })
  );
}
var ToolbarContainer = forwardRef(UnforwardedToolbarContainer);
ToolbarContainer.displayName = "ToolbarContainer";
var toolbar_container_default = ToolbarContainer;
export {
  ToolbarContainer,
  toolbar_container_default as default
};
//# sourceMappingURL=toolbar-container.mjs.map
