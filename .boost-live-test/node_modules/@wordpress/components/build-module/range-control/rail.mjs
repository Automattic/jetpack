// packages/components/src/range-control/rail.tsx
import { isRTL } from "@wordpress/i18n";
import RangeMark from "./mark.mjs";
import { MarksWrapper, Rail } from "./styles/range-control-styles.mjs";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createElement as _createElement } from "react";
function RangeRail(props) {
  const {
    disabled = false,
    marks = false,
    min = 0,
    max = 100,
    step = 1,
    value = 0,
    ...restProps
  } = props;
  return /* @__PURE__ */ _jsxs(_Fragment, {
    children: [/* @__PURE__ */ _jsx(Rail, {
      disabled,
      ...restProps
    }), marks && /* @__PURE__ */ _jsx(Marks, {
      disabled,
      marks,
      min,
      max,
      step,
      value
    })]
  });
}
function Marks(props) {
  const {
    disabled = false,
    marks = false,
    min = 0,
    max = 100,
    step: stepProp = 1,
    value = 0
  } = props;
  const step = stepProp === "any" ? 1 : stepProp;
  const marksData = useMarks({
    marks,
    min,
    max,
    step,
    value
  });
  return /* @__PURE__ */ _jsx(MarksWrapper, {
    "aria-hidden": "true",
    className: "components-range-control__marks",
    children: marksData.map((mark) => /* @__PURE__ */ _createElement(RangeMark, {
      ...mark,
      key: mark.key,
      "aria-hidden": "true",
      disabled
    }))
  });
}
function useMarks({
  marks,
  min = 0,
  max = 100,
  step = 1,
  value = 0
}) {
  if (!marks) {
    return [];
  }
  const range = max - min;
  if (!Array.isArray(marks)) {
    marks = [];
    const count = 1 + Math.round(range / step);
    while (count > marks.push({
      value: step * marks.length + min
    })) {
    }
  }
  const placedMarks = [];
  marks.forEach((mark, index) => {
    if (mark.value < min || mark.value > max) {
      return;
    }
    const key = `mark-${index}`;
    const isFilled = mark.value <= value;
    const offset = `${(mark.value - min) / range * 100}%`;
    const offsetStyle = {
      [isRTL() ? "right" : "left"]: offset
    };
    placedMarks.push({
      ...mark,
      isFilled,
      key,
      style: offsetStyle
    });
  });
  return placedMarks;
}
export {
  RangeRail as default
};
//# sourceMappingURL=rail.mjs.map
