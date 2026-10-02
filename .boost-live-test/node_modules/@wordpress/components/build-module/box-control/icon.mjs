// packages/components/src/box-control/icon.tsx
import { Root, Viewbox, TopStroke, RightStroke, BottomStroke, LeftStroke } from "./styles/box-control-icon-styles.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
var BASE_ICON_SIZE = 24;
function BoxControlIcon({
  size = 24,
  side = "all",
  sides,
  ...props
}) {
  const isSideDisabled = (value) => sides?.length && !sides.includes(value);
  const hasSide = (value) => {
    if (isSideDisabled(value)) {
      return false;
    }
    return side === "all" || side === value;
  };
  const top = hasSide("top") || hasSide("vertical");
  const right = hasSide("right") || hasSide("horizontal");
  const bottom = hasSide("bottom") || hasSide("vertical");
  const left = hasSide("left") || hasSide("horizontal");
  const scale = size / BASE_ICON_SIZE;
  return /* @__PURE__ */ _jsx(Root, {
    style: {
      transform: `scale(${scale})`
    },
    ...props,
    children: /* @__PURE__ */ _jsxs(Viewbox, {
      children: [/* @__PURE__ */ _jsx(TopStroke, {
        isFocused: top
      }), /* @__PURE__ */ _jsx(RightStroke, {
        isFocused: right
      }), /* @__PURE__ */ _jsx(BottomStroke, {
        isFocused: bottom
      }), /* @__PURE__ */ _jsx(LeftStroke, {
        isFocused: left
      })]
    })
  });
}
export {
  BoxControlIcon as default
};
//# sourceMappingURL=icon.mjs.map
