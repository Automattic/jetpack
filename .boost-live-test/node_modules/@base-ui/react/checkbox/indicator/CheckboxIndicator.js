"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CheckboxIndicator = void 0;
var React = _interopRequireWildcard(require("react"));
var _CheckboxRootContext = require("../root/CheckboxRootContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _getCheckboxStateAttributesMapping = require("../utils/getCheckboxStateAttributesMapping");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _useTransitionStatus = require("../../internals/useTransitionStatus");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
/**
 * Indicates whether the checkbox is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
const CheckboxIndicator = exports.CheckboxIndicator = /*#__PURE__*/React.forwardRef(function CheckboxIndicator(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    keepMounted = false,
    ...elementProps
  } = componentProps;
  const rootState = (0, _CheckboxRootContext.useCheckboxRootContext)();
  const rendered = rootState.checked || rootState.indeterminate;
  const {
    mounted,
    transitionStatus,
    setMounted
  } = (0, _useTransitionStatus.useTransitionStatus)(rendered);
  const indicatorRef = React.useRef(null);
  const state = {
    ...rootState,
    transitionStatus
  };
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
  const baseStateAttributesMapping = (0, _getCheckboxStateAttributesMapping.getCheckboxStateAttributesMapping)(rootState);
  const stateAttributesMapping = {
    ...baseStateAttributesMapping,
    ..._stateAttributesMapping.transitionStatusMapping
  };
  const shouldRender = keepMounted || mounted;
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    ref: [forwardedRef, indicatorRef],
    state,
    stateAttributesMapping,
    props: elementProps
  });
  if (!shouldRender) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") CheckboxIndicator.displayName = "CheckboxIndicator";