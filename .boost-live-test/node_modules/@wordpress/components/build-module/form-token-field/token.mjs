// packages/components/src/form-token-field/token.tsx
import clsx from "clsx";
import { useInstanceId } from "@wordpress/compose";
import { __, sprintf } from "@wordpress/i18n";
import { closeSmall } from "@wordpress/icons";
import Button from "../button/index.mjs";
import { VisuallyHidden } from "../visually-hidden/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var noop = () => {
};
function Token({
  value,
  status,
  title,
  displayTransform,
  isBorderless = false,
  disabled = false,
  onClickRemove = noop,
  onMouseEnter,
  onMouseLeave,
  messages,
  termPosition,
  termsCount
}) {
  const instanceId = useInstanceId(Token);
  const tokenClasses = clsx("components-form-token-field__token", {
    "is-error": "error" === status,
    "is-success": "success" === status,
    "is-validating": "validating" === status,
    "is-borderless": isBorderless,
    "is-disabled": disabled
  });
  const onClick = () => onClickRemove({
    value
  });
  const transformedValue = displayTransform(value);
  const termPositionAndCount = sprintf(
    /* translators: 1: term name, 2: term position in a set of terms, 3: total term set count. */
    __("%1$s (%2$d of %3$d)"),
    transformedValue,
    termPosition,
    termsCount
  );
  return /* @__PURE__ */ _jsxs("span", {
    className: tokenClasses,
    onMouseEnter,
    onMouseLeave,
    title,
    children: [/* @__PURE__ */ _jsxs("span", {
      className: "components-form-token-field__token-text",
      id: `components-form-token-field__token-text-${instanceId}`,
      children: [/* @__PURE__ */ _jsx(VisuallyHidden, {
        as: "span",
        children: termPositionAndCount
      }), /* @__PURE__ */ _jsx("span", {
        "aria-hidden": "true",
        children: transformedValue
      })]
    }), /* @__PURE__ */ _jsx(Button, {
      className: "components-form-token-field__remove-token",
      size: "small",
      icon: closeSmall,
      onClick: !disabled ? onClick : void 0,
      disabled,
      label: messages.remove,
      "aria-describedby": `components-form-token-field__token-text-${instanceId}`
    })]
  });
}
export {
  Token as default
};
//# sourceMappingURL=token.mjs.map
