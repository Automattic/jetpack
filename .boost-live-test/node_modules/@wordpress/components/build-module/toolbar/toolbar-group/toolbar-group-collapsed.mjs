// packages/components/src/toolbar/toolbar-group/toolbar-group-collapsed.tsx
import { useContext } from "@wordpress/element";
import DropdownMenu from "../../dropdown-menu/index.mjs";
import ToolbarContext from "../toolbar-context/index.mjs";
import ToolbarItem from "../toolbar-item/index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function ToolbarGroupCollapsed({
  controls = [],
  toggleProps,
  ...props
}) {
  const accessibleToolbarState = useContext(ToolbarContext);
  const renderDropdownMenu = (internalToggleProps) => /* @__PURE__ */ _jsx(DropdownMenu, {
    controls,
    toggleProps: {
      ...internalToggleProps,
      "data-toolbar-item": true
    },
    ...props
  });
  if (accessibleToolbarState) {
    return /* @__PURE__ */ _jsx(ToolbarItem, {
      ...toggleProps,
      children: renderDropdownMenu
    });
  }
  return renderDropdownMenu(toggleProps);
}
var toolbar_group_collapsed_default = ToolbarGroupCollapsed;
export {
  toolbar_group_collapsed_default as default
};
//# sourceMappingURL=toolbar-group-collapsed.mjs.map
