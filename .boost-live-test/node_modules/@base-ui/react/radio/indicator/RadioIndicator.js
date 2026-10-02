"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.RadioIndicator = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _RadioRootContext = require("../root/RadioRootContext");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _useTransitionStatus = require("../../internals/useTransitionStatus");
/**
 * Indicates whether the radio button is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Radio](https://base-ui.com/react/components/radio)
 */
const RadioIndicator = exports.RadioIndicator = /*#__PURE__*/React.forwardRef(function RadioIndicator(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    keepMounted = false,
    ...elementProps
  } = componentProps;
  const rootState = (0, _RadioRootContext.useRadioRootContext)();
  const rendered = rootState.checked;
  const {
    mounted,
    transitionStatus,
    setMounted
  } = (0, _useTransitionStatus.useTransitionStatus)(rendered);
  const state = {
    ...rootState,
    transitionStatus
  };
  const indicatorRef = React.useRef(null);
  const shouldRender = keepMounted || mounted;
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    ref: [forwardedRef, indicatorRef],
    state,
    props: elementProps,
    stateAttributesMapping: _stateAttributesMapping.stateAttributesMapping
  });
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    batch: true,
    enabled: !rendered,
    open: rendered,
    ref: indicatorRef,
    onComplete() {
      if (!rendered) {
        setMounted(false);
      }
    }
  });
  if (!shouldRender) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") RadioIndicator.displayName = "RadioIndicator";