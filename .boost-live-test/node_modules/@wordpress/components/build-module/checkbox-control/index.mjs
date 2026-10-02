// packages/components/src/checkbox-control/index.tsx
import clsx from "clsx";
import { useState } from "@wordpress/element";
import { useInstanceId, useRefEffect } from "@wordpress/compose";
import deprecated from "@wordpress/deprecated";
import { Icon, check, reset } from "@wordpress/icons";
import BaseControl from "../base-control/index.mjs";
import { HStack } from "../h-stack/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function CheckboxControl(props) {
  const {
    // Prevent passing this to `input`.
    __nextHasNoMarginBottom: _,
    label,
    className,
    heading,
    checked,
    indeterminate,
    help,
    id: idProp,
    onChange,
    onClick,
    ...additionalProps
  } = props;
  if (heading) {
    deprecated("`heading` prop in `CheckboxControl`", {
      alternative: "a separate element to implement a heading",
      since: "5.8"
    });
  }
  const [showCheckedIcon, setShowCheckedIcon] = useState(false);
  const [showIndeterminateIcon, setShowIndeterminateIcon] = useState(false);
  const ref = useRefEffect((node) => {
    if (!node) {
      return;
    }
    node.indeterminate = !!indeterminate;
    setShowCheckedIcon(node.matches(":checked"));
    setShowIndeterminateIcon(node.matches(":indeterminate"));
  }, [checked, indeterminate]);
  const id = useInstanceId(CheckboxControl, "inspector-checkbox-control", idProp);
  const onChangeValue = (event) => onChange(event.target.checked);
  return /* @__PURE__ */ _jsx(BaseControl, {
    label: heading,
    id,
    help: help && /* @__PURE__ */ _jsx("span", {
      className: "components-checkbox-control__help",
      children: help
    }),
    className: clsx("components-checkbox-control", className),
    children: /* @__PURE__ */ _jsxs(HStack, {
      spacing: 0,
      justify: "start",
      alignment: "top",
      children: [/* @__PURE__ */ _jsxs("span", {
        className: "components-checkbox-control__input-container",
        children: [/* @__PURE__ */ _jsx("input", {
          ref,
          id,
          className: "components-checkbox-control__input",
          type: "checkbox",
          value: "1",
          onChange: onChangeValue,
          checked,
          "aria-describedby": !!help ? id + "__help" : void 0,
          onClick: (event) => {
            event.currentTarget.focus();
            onClick?.(event);
          },
          ...additionalProps
        }), showIndeterminateIcon ? /* @__PURE__ */ _jsx(Icon, {
          icon: reset,
          className: "components-checkbox-control__indeterminate",
          role: "presentation"
        }) : null, showCheckedIcon ? /* @__PURE__ */ _jsx(Icon, {
          icon: check,
          className: "components-checkbox-control__checked",
          role: "presentation"
        }) : null]
      }), label && /* @__PURE__ */ _jsx("label", {
        className: "components-checkbox-control__label",
        htmlFor: id,
        children: label
      })]
    })
  });
}
var checkbox_control_default = CheckboxControl;
export {
  CheckboxControl,
  checkbox_control_default as default
};
//# sourceMappingURL=index.mjs.map
