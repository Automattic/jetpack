// packages/components/src/toolbar/toolbar-group/index.tsx
import clsx from "clsx";
import { useContext } from "@wordpress/element";
import ToolbarButton from "../toolbar-button/index.mjs";
import ToolbarGroupContainer from "./toolbar-group-container.mjs";
import ToolbarGroupCollapsed from "./toolbar-group-collapsed.mjs";
import ToolbarContext from "../toolbar-context/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function isNestedArray(arr) {
  return Array.isArray(arr) && Array.isArray(arr[0]);
}
function ToolbarGroup({
  controls = [],
  children,
  className,
  isCollapsed,
  title,
  ...props
}) {
  const accessibleToolbarState = useContext(ToolbarContext);
  if ((!controls || !controls.length) && !children) {
    return null;
  }
  const finalClassName = clsx(
    // Unfortunately, there's legacy code referencing to `.components-toolbar`
    // So we can't get rid of it
    accessibleToolbarState ? "components-toolbar-group" : "components-toolbar",
    className
  );
  let controlSets;
  if (isNestedArray(controls)) {
    controlSets = controls;
  } else {
    controlSets = [controls];
  }
  if (isCollapsed) {
    return /* @__PURE__ */ _jsx(ToolbarGroupCollapsed, {
      label: title,
      controls: controlSets,
      className: finalClassName,
      children,
      ...props
    });
  }
  return /* @__PURE__ */ _jsxs(ToolbarGroupContainer, {
    className: finalClassName,
    ...props,
    children: [controlSets?.flatMap((controlSet, indexOfSet) => controlSet.map((control, indexOfControl) => /* @__PURE__ */ _jsx(ToolbarButton, {
      containerClassName: indexOfSet > 0 && indexOfControl === 0 ? "has-left-divider" : void 0,
      ...control
    }, [indexOfSet, indexOfControl].join()))), children]
  });
}
var toolbar_group_default = ToolbarGroup;
export {
  toolbar_group_default as default
};
//# sourceMappingURL=index.mjs.map
