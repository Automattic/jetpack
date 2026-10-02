"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FocusGuard = void 0;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _platform = require("@base-ui/utils/platform");
var _visuallyHidden = require("@base-ui/utils/visuallyHidden");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * @internal
 */
const FocusGuard = exports.FocusGuard = /*#__PURE__*/React.forwardRef(function FocusGuard(props, ref) {
  const [role, setRole] = React.useState();
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    // Unlike NVDA and JAWS, VoiceOver's virtual cursor triggers `onFocus` as
    // it moves — but only on focusable/role-button elements through WebKit's
    // NSAccessibility path. Setting `role="button"` lets the focus trap catch
    // the cursor.
    if (_platform.platform.screenReader.voiceOver && _platform.platform.engine.webkit) {
      setRole('button');
    }
  }, []);
  const restProps = {
    tabIndex: 0,
    // Role is only for VoiceOver
    role
  };
  return /*#__PURE__*/(0, _jsxRuntime.jsx)("span", {
    ...props,
    ref: ref,
    style: _visuallyHidden.visuallyHidden,
    "aria-hidden": role ? undefined : true,
    ...restProps,
    "data-base-ui-focus-guard": ""
  });
});
if (process.env.NODE_ENV !== "production") FocusGuard.displayName = "FocusGuard";