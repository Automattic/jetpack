'use client';

import * as React from 'react';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useRenderElement } from "../../internals/useRenderElement.mjs";
import { useAvatarRootContext } from "../root/AvatarRootContext.mjs";
import { avatarStateAttributesMapping } from "../root/stateAttributesMapping.mjs";

/**
 * Rendered when the image fails to load or when no image is provided.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export const AvatarFallback = /*#__PURE__*/React.forwardRef(function AvatarFallback(componentProps, forwardedRef) {
  const {
    className,
    render,
    delay = 0,
    style,
    ...elementProps
  } = componentProps;
  const {
    imageLoadingStatus
  } = useAvatarRootContext();
  const [delayPassed, setDelayPassed] = React.useState(delay === 0);
  const timeout = useTimeout();
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
  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: avatarStateAttributesMapping,
    enabled: imageLoadingStatus !== 'loaded' && (delay === 0 || delayPassed)
  });
  return element;
});
if (process.env.NODE_ENV !== "production") AvatarFallback.displayName = "AvatarFallback";