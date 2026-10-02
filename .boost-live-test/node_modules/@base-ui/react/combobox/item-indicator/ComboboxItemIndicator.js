"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComboboxItemIndicator = void 0;
var React = _interopRequireWildcard(require("react"));
var _ComboboxItemContext = require("../item/ComboboxItemContext");
var _useTransitionStatus = require("../../internals/useTransitionStatus");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _useRenderElement = require("../../internals/useRenderElement");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Indicates whether the item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
const ComboboxItemIndicator = exports.ComboboxItemIndicator = /*#__PURE__*/React.forwardRef(function ComboboxItemIndicator(componentProps, forwardedRef) {
  const {
    selected
  } = (0, _ComboboxItemContext.useComboboxItemContext)();
  const shouldRender = componentProps.keepMounted || selected;
  if (!shouldRender) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(Inner, {
    ...componentProps,
    ref: forwardedRef
  });
});

// Split the core implementation to avoid paying the hook costs unless the element needs to mount.
if (process.env.NODE_ENV !== "production") ComboboxItemIndicator.displayName = "ComboboxItemIndicator";
const Inner = /*#__PURE__*/React.memo(/*#__PURE__*/React.forwardRef((componentProps, forwardedRef) => {
  const {
    render,
    className,
    style,
    keepMounted,
    ...elementProps
  } = componentProps;
  const {
    selected
  } = (0, _ComboboxItemContext.useComboboxItemContext)();
  const indicatorRef = React.useRef(null);
  const {
    transitionStatus,
    setMounted
  } = (0, _useTransitionStatus.useTransitionStatus)(selected);
  const state = {
    selected,
    transitionStatus
  };
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    ref: [forwardedRef, indicatorRef],
    state,
    props: [{
      'aria-hidden': true,
      children: '✔️'
    }, elementProps],
    stateAttributesMapping: _stateAttributesMapping.transitionStatusMapping
  });
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    batch: true,
    enabled: !selected,
    open: selected,
    ref: indicatorRef,
    onComplete() {
      if (!selected) {
        setMounted(false);
      }
    }
  });
  return element;
}));
if (process.env.NODE_ENV !== "production") Inner.displayName = "Inner";