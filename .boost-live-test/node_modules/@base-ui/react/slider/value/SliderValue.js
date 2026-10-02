"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SliderValue = void 0;
var React = _interopRequireWildcard(require("react"));
var _formatNumber = require("@base-ui/utils/formatNumber");
var _useRenderElement = require("../../internals/useRenderElement");
var _SliderRootContext = require("../root/SliderRootContext");
var _stateAttributesMapping = require("../root/stateAttributesMapping");
/**
 * Displays the current value of the slider as text.
 * Renders an `<output>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
const SliderValue = exports.SliderValue = /*#__PURE__*/React.forwardRef(function SliderValue(componentProps, forwardedRef) {
  const {
    'aria-live': ariaLive = 'off',
    render,
    className,
    children,
    style,
    ...elementProps
  } = componentProps;
  const {
    thumbMap,
    state,
    values,
    format,
    locale
  } = (0, _SliderRootContext.useSliderRootContext)();
  const outputFor = Array.from(thumbMap.values(), ({
    inputId
  }) => inputId).join(' ').trim() || undefined;
  const formattedValues = React.useMemo(() => values.map(v => (0, _formatNumber.formatNumber)(v, locale, format)), [format, locale, values]);
  const defaultDisplayValue = formattedValues.join(' – ');
  const element = (0, _useRenderElement.useRenderElement)('output', componentProps, {
    state,
    ref: forwardedRef,
    props: [{
      // off by default because it will keep announcing when the slider is being dragged
      // and also when the value is changing (but not yet committed)
      'aria-live': ariaLive,
      children: typeof children === 'function' ? children(formattedValues, values) : defaultDisplayValue,
      htmlFor: outputFor
    }, elementProps],
    stateAttributesMapping: _stateAttributesMapping.sliderStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") SliderValue.displayName = "SliderValue";