"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MenuCheckboxItemIndicator = void 0;
var React = _interopRequireWildcard(require("react"));
var _MenuCheckboxItemContext = require("../checkbox-item/MenuCheckboxItemContext");
var _useRenderElement = require("../../internals/useRenderElement");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _useTransitionStatus = require("../../internals/useTransitionStatus");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
/**
 * Indicates whether the checkbox item is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuCheckboxItemIndicator = exports.MenuCheckboxItemIndicator = /*#__PURE__*/React.forwardRef(function MenuCheckboxItemIndicator(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    keepMounted = false,
    ...elementProps
  } = componentProps;
  const item = (0, _MenuCheckboxItemContext.useMenuCheckboxItemContext)();
  const indicatorRef = React.useRef(null);
  const {
    transitionStatus,
    mounted,
    setMounted
  } = (0, _useTransitionStatus.useTransitionStatus)(item.checked);
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    batch: true,
    enabled: !item.checked,
    open: item.checked,
    ref: indicatorRef,
    onComplete() {
      if (!item.checked) {
        setMounted(false);
      }
    }
  });
  const state = {
    checked: item.checked,
    disabled: item.disabled,
    highlighted: item.highlighted,
    transitionStatus
  };
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    state,
    ref: [forwardedRef, indicatorRef],
    stateAttributesMapping: _stateAttributesMapping.itemMapping,
    props: {
      'aria-hidden': true,
      ...elementProps
    },
    enabled: keepMounted || mounted
  });
  return element;
});
if (process.env.NODE_ENV !== "production") MenuCheckboxItemIndicator.displayName = "MenuCheckboxItemIndicator";