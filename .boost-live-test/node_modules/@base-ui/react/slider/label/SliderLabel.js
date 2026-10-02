"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SliderLabel = void 0;
var React = _interopRequireWildcard(require("react"));
var _dom = require("@floating-ui/utils/dom");
var _owner = require("@base-ui/utils/owner");
var _useLabel = require("../../internals/labelable-provider/useLabel");
var _useRenderElement = require("../../internals/useRenderElement");
var _SliderRootContext = require("../root/SliderRootContext");
var _stateAttributesMapping = require("../root/stateAttributesMapping");
/**
 * An accessible label that is automatically associated with the slider thumbs.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
const SliderLabel = exports.SliderLabel = /*#__PURE__*/React.forwardRef(function SliderLabel(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  // Keep label id derived from the root and ignore runtime `id` overrides from untyped consumers.
  const elementPropsWithoutId = elementProps;
  delete elementPropsWithoutId.id;
  const {
    state,
    setLabelId,
    controlRef,
    rootLabelId
  } = (0, _SliderRootContext.useSliderRootContext)();
  function focusControl(event, controlId) {
    if (controlId) {
      const controlElement = (0, _owner.ownerDocument)(event.currentTarget).getElementById(controlId);
      if ((0, _dom.isHTMLElement)(controlElement)) {
        (0, _useLabel.focusElementWithVisible)(controlElement);
        return;
      }
    }
    const fallbackInputs = controlRef.current?.querySelectorAll('input[type="range"]');
    const fallbackInput = fallbackInputs?.length === 1 ? fallbackInputs[0] : null;
    if ((0, _dom.isHTMLElement)(fallbackInput)) {
      (0, _useLabel.focusElementWithVisible)(fallbackInput);
    }
  }
  const labelProps = (0, _useLabel.useLabel)({
    id: rootLabelId,
    setLabelId,
    focusControl
  });
  return (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: forwardedRef,
    state,
    props: [labelProps, elementProps],
    stateAttributesMapping: _stateAttributesMapping.sliderStateAttributesMapping
  });
});
if (process.env.NODE_ENV !== "production") SliderLabel.displayName = "SliderLabel";