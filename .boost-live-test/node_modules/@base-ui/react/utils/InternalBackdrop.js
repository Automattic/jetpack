"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InternalBackdrop = void 0;
var React = _interopRequireWildcard(require("react"));
var _jsxRuntime = require("react/jsx-runtime");
/**
 * @internal
 */
const InternalBackdrop = exports.InternalBackdrop = /*#__PURE__*/React.forwardRef(function InternalBackdrop(props, ref) {
  const {
    cutout,
    ...otherProps
  } = props;
  let clipPath;
  if (cutout) {
    const rect = cutout.getBoundingClientRect();
    clipPath = `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,${rect.left}px ${rect.top}px,${rect.left}px ${rect.bottom}px,${rect.right}px ${rect.bottom}px,${rect.right}px ${rect.top}px,${rect.left}px ${rect.top}px)`;
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
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