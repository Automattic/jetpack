// packages/components/src/focal-point-picker/grid.tsx
import { GridView, GridLineX, GridLineY } from "./styles/focal-point-picker-style.mjs";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function FocalPointPickerGrid({
  bounds,
  ...props
}) {
  return /* @__PURE__ */ _jsxs(GridView, {
    ...props,
    className: "components-focal-point-picker__grid",
    style: {
      width: bounds.width,
      height: bounds.height
    },
    children: [/* @__PURE__ */ _jsx(GridLineX, {
      style: {
        top: "33%"
      }
    }), /* @__PURE__ */ _jsx(GridLineX, {
      style: {
        top: "66%"
      }
    }), /* @__PURE__ */ _jsx(GridLineY, {
      style: {
        left: "33%"
      }
    }), /* @__PURE__ */ _jsx(GridLineY, {
      style: {
        left: "66%"
      }
    })]
  });
}
export {
  FocalPointPickerGrid as default
};
//# sourceMappingURL=grid.mjs.map
