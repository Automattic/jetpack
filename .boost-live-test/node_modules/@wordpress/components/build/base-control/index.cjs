"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/components/src/base-control/index.tsx
var base_control_exports = {};
__export(base_control_exports, {
  BaseControl: () => BaseControl,
  VisualLabel: () => VisualLabel,
  default: () => base_control_default,
  useBaseControlProps: () => import_hooks.useBaseControlProps
});
module.exports = __toCommonJS(base_control_exports);
var import_clsx = __toESM(require("clsx"));
var import_element = require("@wordpress/element");
var import_visually_hidden = require("../visually-hidden/index.cjs");
var import_base_control_styles = require("./styles/base-control-styles.cjs");
var import_context = require("../context/index.cjs");
var import_jsx_runtime = require("react/jsx-runtime");
var import_hooks = require("./hooks.cjs");
var UnconnectedBaseControl = (props) => {
  const {
    id,
    label,
    hideLabelFromVision = false,
    help,
    className,
    children
  } = (0, import_context.useContextSystem)(props, "BaseControl");
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_base_control_styles.Wrapper, {
    className,
    children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_base_control_styles.StyledField, {
      className: "components-base-control__field",
      children: [label && id && (hideLabelFromVision ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_visually_hidden.VisuallyHidden, {
        as: "label",
        htmlFor: id,
        children: label
      }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_base_control_styles.StyledLabel, {
        className: "components-base-control__label",
        htmlFor: id,
        children: label
      })), label && !id && (hideLabelFromVision ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_visually_hidden.VisuallyHidden, {
        as: "label",
        children: label
      }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VisualLabel, {
        children: label
      })), children]
    }), !!help && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_base_control_styles.StyledHelp, {
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
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_base_control_styles.StyledVisualLabel, {
    ref,
    ...restProps,
    className: (0, import_clsx.default)("components-base-control__label", className),
    children
  });
};
var VisualLabel = (0, import_element.forwardRef)(UnforwardedVisualLabel);
var BaseControl = Object.assign((0, import_context.contextConnectWithoutRef)(UnconnectedBaseControl, "BaseControl"), {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseControl,
  VisualLabel,
  useBaseControlProps
});
//# sourceMappingURL=index.cjs.map
