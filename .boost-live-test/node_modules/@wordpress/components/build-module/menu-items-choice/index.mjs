// packages/components/src/menu-items-choice/index.tsx
import { check } from "@wordpress/icons";
import MenuItem from "../menu-item/index.mjs";
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
var noop = () => {
};
function MenuItemsChoice({
  choices = [],
  onHover = noop,
  onSelect,
  value
}) {
  return /* @__PURE__ */ _jsx(_Fragment, {
    children: choices.map((item) => {
      const isSelected = value === item.value;
      return /* @__PURE__ */ _jsx(MenuItem, {
        role: "menuitemradio",
        disabled: item.disabled,
        icon: isSelected ? check : null,
        info: item.info,
        isSelected,
        shortcut: item.shortcut,
        className: "components-menu-items-choice",
        onClick: () => {
          if (!isSelected) {
            onSelect(item.value);
          }
        },
        onMouseEnter: () => onHover(item.value),
        onMouseLeave: () => onHover(null),
        "aria-label": item["aria-label"],
        children: item.label
      }, item.value);
    })
  });
}
var menu_items_choice_default = MenuItemsChoice;
export {
  menu_items_choice_default as default
};
//# sourceMappingURL=index.mjs.map
