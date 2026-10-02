"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AvatarRoot = void 0;
var React = _interopRequireWildcard(require("react"));
var _useRenderElement = require("../../internals/useRenderElement");
var _AvatarRootContext = require("./AvatarRootContext");
var _stateAttributesMapping = require("./stateAttributesMapping");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Displays a user's profile picture, initials, or fallback icon.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
const AvatarRoot = exports.AvatarRoot = /*#__PURE__*/React.forwardRef(function AvatarRoot(componentProps, forwardedRef) {
  const {
    className,
    render,
    style,
    ...elementProps
  } = componentProps;
  const [imageLoadingStatus, setImageLoadingStatus] = React.useState('idle');
  const state = {
    imageLoadingStatus
  };
  const contextValue = React.useMemo(() => ({
    imageLoadingStatus,
    setImageLoadingStatus
  }), [imageLoadingStatus, setImageLoadingStatus]);
  const element = (0, _useRenderElement.useRenderElement)('span', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: _stateAttributesMapping.avatarStateAttributesMapping
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_AvatarRootContext.AvatarRootContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") AvatarRoot.displayName = "AvatarRoot";