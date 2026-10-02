// packages/components/src/box-control/linked-button.tsx
import { link, linkOff } from "@wordpress/icons";
import { __ } from "@wordpress/i18n";
import Button from "../button/index.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
function LinkedButton({
  isLinked,
  ...props
}) {
  const label = isLinked ? __("Unlink sides") : __("Link sides");
  return /* @__PURE__ */ _jsx(Button, {
    ...props,
    className: "component-box-control__linked-button",
    size: "small",
    icon: isLinked ? link : linkOff,
    iconSize: 24,
    label
  });
}
export {
  LinkedButton as default
};
//# sourceMappingURL=linked-button.mjs.map
