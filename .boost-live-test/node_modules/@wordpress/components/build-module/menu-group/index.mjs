// packages/components/src/menu-group/index.tsx
import clsx from "clsx";
import { Children } from "@wordpress/element";
import { useInstanceId } from "@wordpress/compose";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function MenuGroup(props) {
  const {
    children,
    className = "",
    label,
    hideSeparator
  } = props;
  const instanceId = useInstanceId(MenuGroup);
  if (!Children.count(children)) {
    return null;
  }
  const labelId = `components-menu-group-label-${instanceId}`;
  const classNames = clsx(className, "components-menu-group", {
    "has-hidden-separator": hideSeparator
  });
  return /* @__PURE__ */ _jsxs("div", {
    className: classNames,
    children: [label && /* @__PURE__ */ _jsx("div", {
      className: "components-menu-group__label",
      id: labelId,
      "aria-hidden": "true",
      children: label
    }), /* @__PURE__ */ _jsx("div", {
      role: "group",
      "aria-labelledby": label ? labelId : void 0,
      children
    })]
  });
}
var menu_group_default = MenuGroup;
export {
  MenuGroup,
  menu_group_default as default
};
//# sourceMappingURL=index.mjs.map
