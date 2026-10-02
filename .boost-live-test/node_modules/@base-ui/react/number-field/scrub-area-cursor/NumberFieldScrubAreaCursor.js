"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.NumberFieldScrubAreaCursor = void 0;
var React = _interopRequireWildcard(require("react"));
var ReactDOM = _interopRequireWildcard(require("react-dom"));
var _platform = require("@base-ui/utils/platform");
var _owner = require("@base-ui/utils/owner");
var _NumberFieldRootContext = require("../root/NumberFieldRootContext");
var _stateAttributesMapping = require("../utils/stateAttributesMapping");
var _NumberFieldScrubAreaContext = require("../scrub-area/NumberFieldScrubAreaContext");
var _useRenderElement = require("../../internals/useRenderElement");
const CURSOR_STYLE = {
  position: 'fixed',
  top: 0,
  left: 0,
  pointerEvents: 'none'
};

/**
 * A custom element to display instead of the native cursor while using the scrub area.
 * Renders a `<span>` element.
 *
 * This component uses the [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API), which may prompt the browser to display a related notification. It is disabled
 * in Safari to avoid a layout shift that this notification causes there.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
const NumberFieldScrubAreaCursor = exports.NumberFieldScrubAreaCursor = /*#__PURE__*/React.forwardRef(function NumberFieldScrubAreaCursor(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    state
  } = (0, _NumberFieldRootContext.useNumberFieldRootContext)();
  const {
    isScrubbing,
    isTouchInput,
    isPointerLockDenied,
    scrubAreaCursorRef
  } = (0, _NumberFieldScrubAreaContext.useNumberFieldScrubAreaContext)();
  const [domElement, setDomElement] = React.useState(null);
  const shouldRender = isScrubbing && !_platform.platform.engine.webkit && !isTouchInput && !isPointerLockDenied;
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    enabled: shouldRender,
    ref: [forwardedRef, scrubAreaCursorRef, setDomElement],
    state,
    props: [{
      role: 'presentation',
      style: CURSOR_STYLE
    }, elementProps],
    stateAttributesMapping: _stateAttributesMapping.stateAttributesMapping
  });
  return element && /*#__PURE__*/ReactDOM.createPortal(element, (0, _owner.ownerDocument)(domElement).body);
});
if (process.env.NODE_ENV !== "production") NumberFieldScrubAreaCursor.displayName = "NumberFieldScrubAreaCursor";