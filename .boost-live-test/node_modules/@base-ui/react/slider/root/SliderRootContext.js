"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SliderRootContext = void 0;
exports.useSliderRootContext = useSliderRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
const SliderRootContext = exports.SliderRootContext = /*#__PURE__*/React.createContext(undefined);
if (process.env.NODE_ENV !== "production") SliderRootContext.displayName = "SliderRootContext";
function useSliderRootContext() {
  const context = React.useContext(SliderRootContext);
  if (context === undefined) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: SliderRootContext is missing. Slider parts must be placed within <Slider.Root>.' : (0, _formatErrorMessage2.default)(62));
  }
  return context;
}