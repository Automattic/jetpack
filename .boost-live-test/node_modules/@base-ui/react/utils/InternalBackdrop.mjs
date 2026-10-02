import * as React from 'react';

/**
 * @internal
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const InternalBackdrop = /*#__PURE__*/React.forwardRef(function InternalBackdrop(props, ref) {
  const {
    cutout,
    ...otherProps
  } = props;
  let clipPath;
  if (cutout) {
    const rect = cutout.getBoundingClientRect();
    clipPath = `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${rect.left}px ${rect.top}px,${rect.left}px ${rect.bottom}px,${rect.right}px ${rect.bottom}px,${rect.right}px ${rect.top}px,${rect.left}px ${rect.top}px)`;
  }
  return /*#__PURE__*/_jsx("div", {
    ref: ref,
    role: "presentation"
    // Ensures Floating UI's outside press detection runs, as it considers
    // it an element that existed when the popup rendered.
    ,
    "data-base-ui-inert": "",
    ...otherProps,
    style: {
      position: 'fixed',
      inset: 0,
      userSelect: 'none',
      WebkitUserSelect: 'none',
      clipPath
    }
  });
});
if (process.env.NODE_ENV !== "production") InternalBackdrop.displayName = "InternalBackdrop";