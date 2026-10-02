// packages/components/src/placeholder/index.tsx
import clsx from "clsx";
import { useResizeObserver } from "@wordpress/compose";
import { SVG, Path } from "@wordpress/primitives";
import { useEffect } from "@wordpress/element";
import { speak } from "@wordpress/a11y";
import Icon from "../icon/index.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var PlaceholderIllustration = /* @__PURE__ */ _jsx(SVG, {
  className: "components-placeholder__illustration",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 60 60",
  preserveAspectRatio: "none",
  children: /* @__PURE__ */ _jsx(Path, {
    vectorEffect: "non-scaling-stroke",
    d: "M60 60 0 0"
  })
});
function Placeholder(props) {
  const {
    icon,
    children,
    label,
    instructions,
    className,
    notices,
    preview,
    isColumnLayout,
    withIllustration,
    ...additionalProps
  } = props;
  const [resizeListener, {
    width
  }] = useResizeObserver();
  let modifierClassNames;
  if (typeof width === "number") {
    modifierClassNames = {
      "is-large": width >= 480,
      "is-medium": width >= 160 && width < 480,
      "is-small": width < 160
    };
  }
  const classes = clsx("components-placeholder", className, modifierClassNames, withIllustration ? "has-illustration" : null);
  const fieldsetClasses = clsx("components-placeholder__fieldset", {
    "is-column-layout": isColumnLayout
  });
  useEffect(() => {
    if (instructions) {
      speak(instructions);
    }
  }, [instructions]);
  return /* @__PURE__ */ _jsxs("div", {
    ...additionalProps,
    className: classes,
    children: [withIllustration ? PlaceholderIllustration : null, resizeListener, notices, preview && /* @__PURE__ */ _jsx("div", {
      className: "components-placeholder__preview",
      children: preview
    }), /* @__PURE__ */ _jsxs("div", {
      className: "components-placeholder__label",
      children: [/* @__PURE__ */ _jsx(Icon, {
        icon
      }), label]
    }), !!instructions && /* @__PURE__ */ _jsx("div", {
      className: "components-placeholder__instructions",
      children: instructions
    }), /* @__PURE__ */ _jsx("div", {
      className: fieldsetClasses,
      children
    })]
  });
}
var placeholder_default = Placeholder;
export {
  Placeholder,
  placeholder_default as default
};
//# sourceMappingURL=index.mjs.map
