"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CollapsibleTrigger = void 0;
var React = _interopRequireWildcard(require("react"));
var _collapsibleOpenStateMapping = require("../../utils/collapsibleOpenStateMapping");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var _useRenderElement = require("../../internals/useRenderElement");
var _useButton = require("../../internals/use-button");
var _CollapsibleRootContext = require("../root/CollapsibleRootContext");
const stateAttributesMapping = {
  ..._collapsibleOpenStateMapping.triggerOpenStateMapping,
  ..._stateAttributesMapping.transitionStatusMapping
};

/**
 * A button that opens and closes the collapsible panel.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Collapsible](https://base-ui.com/react/components/collapsible)
 */
const CollapsibleTrigger = exports.CollapsibleTrigger = /*#__PURE__*/React.forwardRef(function CollapsibleTrigger(componentProps, forwardedRef) {
  const {
    panelId,
    open,
    handleTrigger,
    state,
    disabled: contextDisabled
  } = (0, _CollapsibleRootContext.useCollapsibleRootContext)();
  const {
    className,
    disabled = contextDisabled,
    render,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;
  const {
    getButtonProps,
    buttonRef
  } = (0, _useButton.useButton)({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton
  });
  const element = (0, _useRenderElement.useRenderElement)('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [{
      'aria-controls': open ? panelId : undefined,
      'aria-expanded': open,
      onClick: handleTrigger
    }, elementProps, getButtonProps],
    stateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") CollapsibleTrigger.displayName = "CollapsibleTrigger";