// packages/components/src/badge/index.tsx
import clsx from "clsx";
import { info, caution, error, published } from "@wordpress/icons";
import Icon from "../icon/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function contextBasedIcon(intent = "default") {
  switch (intent) {
    case "info":
      return info;
    case "success":
      return published;
    case "warning":
      return caution;
    case "error":
      return error;
    default:
      return null;
  }
}
function Badge({
  className,
  intent = "default",
  children,
  ...props
}) {
  const icon = contextBasedIcon(intent);
  const hasIcon = !!icon;
  return /* @__PURE__ */ _jsx("span", {
    className: clsx("components-badge", className, {
      [`is-${intent}`]: intent,
      "has-icon": hasIcon
    }),
    ...props,
    children: /* @__PURE__ */ _jsxs("span", {
      className: "components-badge__flex-wrapper",
      children: [hasIcon && /* @__PURE__ */ _jsx(Icon, {
        icon,
        size: 16,
        fill: "currentColor",
        className: "components-badge__icon"
      }), /* @__PURE__ */ _jsx("span", {
        className: "components-badge__content",
        children
      })]
    })
  });
}
var badge_default = Badge;
export {
  badge_default as default
};
//# sourceMappingURL=index.mjs.map
