'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { platform } from '@base-ui/utils/platform';
import { ownerDocument } from '@base-ui/utils/owner';
import { useNumberFieldRootContext } from "../root/NumberFieldRootContext.mjs";
import { stateAttributesMapping } from "../utils/stateAttributesMapping.mjs";
import { useNumberFieldScrubAreaContext } from "../scrub-area/NumberFieldScrubAreaContext.mjs";
import { useRenderElement } from "../../internals/useRenderElement.mjs";
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
export const NumberFieldScrubAreaCursor = /*#__PURE__*/React.forwardRef(function NumberFieldScrubAreaCursor(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    ...elementProps
  } = componentProps;
  const {
    state
  } = useNumberFieldRootContext();
  const {
    isScrubbing,
    isTouchInput,
    isPointerLockDenied,
    scrubAreaCursorRef
  } = useNumberFieldScrubAreaContext();
  const [domElement, setDomElement] = React.useState(null);
  const shouldRender = isScrubbing && !platform.engine.webkit && !isTouchInput && !isPointerLockDenied;
  const element = useRenderElement('span', componentProps, {
    enabled: shouldRender,
    ref: [forwardedRef, scrubAreaCursorRef, setDomElement],
    state,
    props: [{
      role: 'presentation',
      style: CURSOR_STYLE
    }, elementProps],
    stateAttributesMapping
  });
  return element && /*#__PURE__*/ReactDOM.createPortal(element, ownerDocument(domElement).body);
});
if (process.env.NODE_ENV !== "production") NumberFieldScrubAreaCursor.displayName = "NumberFieldScrubAreaCursor";