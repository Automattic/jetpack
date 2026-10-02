// packages/components/src/panel/body.tsx
import clsx from "clsx";
import { useReducedMotion, useMergeRefs } from "@wordpress/compose";
import { forwardRef, useRef } from "@wordpress/element";
import { chevronUp, chevronDown } from "@wordpress/icons";
import Button from "../button/index.mjs";
import Icon from "../icon/index.mjs";
import { useControlledState, useUpdateEffect } from "../utils/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var noop = () => {
};
function UnforwardedPanelBody(props, ref) {
  const {
    buttonProps = {},
    children,
    className,
    icon,
    initialOpen,
    onToggle = noop,
    opened,
    title,
    scrollAfterOpen = true
  } = props;
  const [isOpened, setIsOpened] = useControlledState(opened, {
    initial: initialOpen === void 0 ? true : initialOpen,
    fallback: false
  });
  const nodeRef = useRef(null);
  const scrollBehavior = useReducedMotion() ? "auto" : "smooth";
  const handleOnToggle = (event) => {
    event.preventDefault();
    const next = !isOpened;
    setIsOpened(next);
    onToggle(next);
  };
  const scrollAfterOpenRef = useRef(void 0);
  scrollAfterOpenRef.current = scrollAfterOpen;
  useUpdateEffect(() => {
    if (isOpened && scrollAfterOpenRef.current && nodeRef.current?.scrollIntoView) {
      nodeRef.current.scrollIntoView({
        inline: "nearest",
        block: "nearest",
        behavior: scrollBehavior
      });
    }
  }, [isOpened, scrollBehavior]);
  const classes = clsx("components-panel__body", className, {
    "is-opened": isOpened
  });
  return /* @__PURE__ */ _jsxs("div", {
    className: classes,
    ref: useMergeRefs([nodeRef, ref]),
    children: [/* @__PURE__ */ _jsx(PanelBodyTitle, {
      icon,
      isOpened: Boolean(isOpened),
      onClick: handleOnToggle,
      title,
      ...buttonProps
    }), typeof children === "function" ? children({
      opened: Boolean(isOpened)
    }) : isOpened && children]
  });
}
var PanelBodyTitle = forwardRef(({
  isOpened,
  icon,
  title,
  ...props
}, ref) => {
  if (!title) {
    return null;
  }
  return /* @__PURE__ */ _jsx("h2", {
    className: "components-panel__body-title",
    children: /* @__PURE__ */ _jsxs(Button, {
      __next40pxDefaultSize: true,
      className: "components-panel__body-toggle",
      "aria-expanded": isOpened,
      ref,
      ...props,
      children: [/* @__PURE__ */ _jsx("span", {
        "aria-hidden": "true",
        children: /* @__PURE__ */ _jsx(Icon, {
          className: "components-panel__arrow",
          icon: isOpened ? chevronUp : chevronDown
        })
      }), title, icon && /* @__PURE__ */ _jsx(Icon, {
        icon,
        className: "components-panel__icon",
        size: 20
      })]
    })
  });
});
var PanelBody = forwardRef(UnforwardedPanelBody);
PanelBody.displayName = "PanelBody";
var body_default = PanelBody;
export {
  PanelBody,
  UnforwardedPanelBody,
  body_default as default
};
//# sourceMappingURL=body.mjs.map
