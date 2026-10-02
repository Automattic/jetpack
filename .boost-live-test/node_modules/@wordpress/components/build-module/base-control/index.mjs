// packages/components/src/base-control/index.tsx
import clsx from "clsx";
import { forwardRef } from "@wordpress/element";
import { VisuallyHidden } from "../visually-hidden/index.mjs";
import { Wrapper, StyledField, StyledLabel, StyledHelp, StyledVisualLabel } from "./styles/base-control-styles.mjs";
import { contextConnectWithoutRef, useContextSystem } from "../context/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useBaseControlProps } from "./hooks.mjs";
var UnconnectedBaseControl = (props) => {
  const {
    id,
    label,
    hideLabelFromVision = false,
    help,
    className,
    children
  } = useContextSystem(props, "BaseControl");
  return /* @__PURE__ */ _jsxs(Wrapper, {
    className,
    children: [/* @__PURE__ */ _jsxs(StyledField, {
      className: "components-base-control__field",
      children: [label && id && (hideLabelFromVision ? /* @__PURE__ */ _jsx(VisuallyHidden, {
        as: "label",
        htmlFor: id,
        children: label
      }) : /* @__PURE__ */ _jsx(StyledLabel, {
        className: "components-base-control__label",
        htmlFor: id,
        children: label
      })), label && !id && (hideLabelFromVision ? /* @__PURE__ */ _jsx(VisuallyHidden, {
        as: "label",
        children: label
      }) : /* @__PURE__ */ _jsx(VisualLabel, {
        children: label
      })), children]
    }), !!help && /* @__PURE__ */ _jsx(StyledHelp, {
      id: id ? id + "__help" : void 0,
      className: "components-base-control__help",
      children: help
    })]
  });
};
var UnforwardedVisualLabel = (props, ref) => {
  const {
    className,
    children,
    ...restProps
  } = props;
  return /* @__PURE__ */ _jsx(StyledVisualLabel, {
    ref,
    ...restProps,
    className: clsx("components-base-control__label", className),
    children
  });
};
var VisualLabel = forwardRef(UnforwardedVisualLabel);
var BaseControl = Object.assign(contextConnectWithoutRef(UnconnectedBaseControl, "BaseControl"), {
  /**
   * `BaseControl.VisualLabel` is used to render a purely visual label inside a `BaseControl` component.
   *
   * It should only be used in cases where the children being rendered inside `BaseControl` are already accessibly labeled,
   * e.g., a button, but we want an additional visual label for that section equivalent to the labels `BaseControl` would
   * otherwise use if the `label` prop was passed.
   *
   * ```jsx
   * import { BaseControl } from '@wordpress/components';
   *
   * const MyBaseControl = () => (
   * 	<BaseControl help="This button is already accessibly labeled.">
   * 		<BaseControl.VisualLabel>Author</BaseControl.VisualLabel>
   * 		<Button>Select an author</Button>
   * 	</BaseControl>
   * );
   * ```
   */
  VisualLabel
});
var base_control_default = BaseControl;
export {
  BaseControl,
  VisualLabel,
  base_control_default as default,
  useBaseControlProps
};
//# sourceMappingURL=index.mjs.map
