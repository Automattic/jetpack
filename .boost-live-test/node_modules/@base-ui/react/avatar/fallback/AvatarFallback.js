"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AvatarFallback = void 0;
var React = _interopRequireWildcard(require("react"));
var _useTimeout = require("@base-ui/utils/useTimeout");
var _useRenderElement = require("../../internals/useRenderElement");
var _AvatarRootContext = require("../root/AvatarRootContext");
var _stateAttributesMapping = require("../root/stateAttributesMapping");
/**
 * Rendered when the image fails to load or when no image is provided.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
const AvatarFallback = exports.AvatarFallback = /*#__PURE__*/React.forwardRef(function AvatarFallback(componentProps, forwardedRef) {
  const {
    className,
    render,
    delay = 0,
    style,
    ...elementProps
  } = componentProps;
  const {
    imageLoadingStatus
  } = (0, _AvatarRootContext.useAvatarRootContext)();
  const [delayPassed, setDelayPassed] = React.useState(delay === 0);
  const timeout = (0, _useTimeout.useTimeout)();
  React.useEffect(() => {
    if (delay > 0) {
      timeout.start(delay, () => setDelayPassed(true));
    } else {
      // Once the fallback is shown without a delay, keep it visible. Otherwise a later
      // change from no delay to a number would re-hide an already-visible fallback.
      setDelayPassed(true);
    }
    return timeout.clear;
  }, [timeout, delay]);
  const state = {
    imageLoadingStatus
  };
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: _stateAttributesMapping.avatarStateAttributesMapping,
    enabled: imageLoadingStatus !== 'loaded' && (delay === 0 || delayPassed)
  });
  return element;
});
if (process.env.NODE_ENV !== "production") AvatarFallback.displayName = "AvatarFallback";