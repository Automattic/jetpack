// packages/components/src/toolbar/toolbar/index.tsx
import clsx from "clsx";
import { forwardRef, useMemo } from "@wordpress/element";
import deprecated from "@wordpress/deprecated";
import ToolbarGroup from "../toolbar-group/index.mjs";
import ToolbarContainer from "./toolbar-container.mjs";
import { ContextSystemProvider } from "../../context/index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnforwardedToolbar({
  className,
  label,
  variant,
  ...props
}, ref) {
  const isVariantDefined = variant !== void 0;
  const contextSystemValue = useMemo(() => {
    if (isVariantDefined) {
      return {};
    }
    return {
      DropdownMenu: {
        variant: "toolbar"
      },
      Dropdown: {
        variant: "toolbar"
      },
      Menu: {
        variant: "toolbar"
      }
    };
  }, [isVariantDefined]);
  if (!label) {
    deprecated("Using Toolbar without label prop", {
      since: "5.6",
      alternative: "ToolbarGroup component",
      link: "https://developer.wordpress.org/block-editor/components/toolbar/"
    });
    const {
      title: _title,
      ...restProps
    } = props;
    return /* @__PURE__ */ _jsx(ToolbarGroup, {
      isCollapsed: false,
      ...restProps,
      className
    });
  }
  const finalClassName = clsx("components-accessible-toolbar", className, variant && `is-${variant}`);
  return /* @__PURE__ */ _jsx(ContextSystemProvider, {
    value: contextSystemValue,
    children: /* @__PURE__ */ _jsx(ToolbarContainer, {
      className: finalClassName,
      label,
      ref,
      ...props
    })
  });
}
var Toolbar = forwardRef(UnforwardedToolbar);
Toolbar.displayName = "Toolbar";
var toolbar_default = Toolbar;
export {
  Toolbar,
  toolbar_default as default
};
//# sourceMappingURL=index.mjs.map
