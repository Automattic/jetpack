// packages/components/src/form-toggle/index.tsx
import clsx from "clsx";
import { forwardRef } from "@wordpress/element";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var noop = () => {
};
function UnforwardedFormToggle(props, ref) {
  const {
    className,
    checked,
    id,
    disabled,
    onChange = noop,
    onClick,
    ...additionalProps
  } = props;
  const wrapperClasses = clsx("components-form-toggle", className, {
    "is-checked": checked,
    "is-disabled": disabled
  });
  return /* @__PURE__ */ _jsxs("span", {
    className: wrapperClasses,
    children: [/* @__PURE__ */ _jsx("input", {
      className: "components-form-toggle__input",
      id,
      type: "checkbox",
      checked,
      onChange,
      disabled,
      onClick: (event) => {
        event.currentTarget.focus();
        onClick?.(event);
      },
      ...additionalProps,
      ref
    }), /* @__PURE__ */ _jsx("span", {
      className: "components-form-toggle__track"
    }), /* @__PURE__ */ _jsx("span", {
      className: "components-form-toggle__thumb"
    })]
  });
}
var FormToggle = forwardRef(UnforwardedFormToggle);
FormToggle.displayName = "FormToggle";
var form_toggle_default = FormToggle;
export {
  FormToggle,
  form_toggle_default as default,
  noop
};
//# sourceMappingURL=index.mjs.map
