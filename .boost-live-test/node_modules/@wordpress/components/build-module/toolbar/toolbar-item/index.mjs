// packages/components/src/toolbar/toolbar-item/index.tsx
import * as Ariakit from "@ariakit/react";
import { forwardRef, useContext } from "@wordpress/element";
import warning from "@wordpress/warning";
import ToolbarContext from "../toolbar-context/index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnforwardedToolbarItem({
  children,
  as: Component,
  ...props
}, ref) {
  const accessibleToolbarStore = useContext(ToolbarContext);
  const isRenderProp = typeof children === "function";
  if (!isRenderProp && !Component) {
    globalThis.SCRIPT_DEBUG === true ? warning("`ToolbarItem` is a generic headless component. You must pass either a `children` prop as a function or an `as` prop as a component. See https://developer.wordpress.org/block-editor/components/toolbar-item/") : void 0;
    return null;
  }
  const allProps = {
    ...props,
    ref,
    "data-toolbar-item": true
  };
  if (!accessibleToolbarStore) {
    if (Component) {
      return /* @__PURE__ */ _jsx(Component, {
        ...allProps,
        children
      });
    }
    if (!isRenderProp) {
      return null;
    }
    return children(allProps);
  }
  const render = isRenderProp ? children : Component && /* @__PURE__ */ _jsx(Component, {
    children
  });
  return /* @__PURE__ */ _jsx(Ariakit.ToolbarItem, {
    accessibleWhenDisabled: true,
    ...allProps,
    store: accessibleToolbarStore,
    render
  });
}
var ToolbarItem2 = forwardRef(UnforwardedToolbarItem);
ToolbarItem2.displayName = "ToolbarItem";
var toolbar_item_default = ToolbarItem2;
export {
  ToolbarItem2 as ToolbarItem,
  toolbar_item_default as default
};
//# sourceMappingURL=index.mjs.map
