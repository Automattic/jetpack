// packages/components/src/toolbar/toolbar-dropdown-menu/index.tsx
import { forwardRef, useContext } from "@wordpress/element";
import ToolbarItem from "../toolbar-item/index.mjs";
import ToolbarContext from "../toolbar-context/index.mjs";
import DropdownMenu from "../../dropdown-menu/index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function UnforwardedToolbarDropdownMenu(props, ref) {
  const accessibleToolbarState = useContext(ToolbarContext);
  if (!accessibleToolbarState) {
    return /* @__PURE__ */ _jsx(DropdownMenu, {
      ...props
    });
  }
  return /* @__PURE__ */ _jsx(ToolbarItem, {
    ref,
    ...props.toggleProps,
    children: (toolbarItemProps) => /* @__PURE__ */ _jsx(DropdownMenu, {
      ...props,
      popoverProps: {
        ...props.popoverProps
      },
      toggleProps: toolbarItemProps
    })
  });
}
var ToolbarDropdownMenu = forwardRef(UnforwardedToolbarDropdownMenu);
ToolbarDropdownMenu.displayName = "ToolbarDropdownMenu";
var toolbar_dropdown_menu_default = ToolbarDropdownMenu;
export {
  ToolbarDropdownMenu,
  toolbar_dropdown_menu_default as default
};
//# sourceMappingURL=index.mjs.map
