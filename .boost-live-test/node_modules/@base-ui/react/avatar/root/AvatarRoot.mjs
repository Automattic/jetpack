'use client';

import * as React from 'react';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { AvatarRootContext } from "./AvatarRootContext.mjs";
import { avatarStateAttributesMapping } from "./stateAttributesMapping.mjs";

/**
 * Displays a user's profile picture, initials, or fallback icon.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const AvatarRoot = /*#__PURE__*/React.forwardRef(function AvatarRoot(componentProps, forwardedRef) {
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
  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: avatarStateAttributesMapping
  });
  return /*#__PURE__*/_jsx(AvatarRootContext.Provider, {
    value: contextValue,
    children: element
  });
});
if (process.env.NODE_ENV !== "production") AvatarRoot.displayName = "AvatarRoot";