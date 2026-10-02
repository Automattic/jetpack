"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FieldValidity = void 0;
var React = _interopRequireWildcard(require("react"));
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _getCombinedFieldValidityData = require("../utils/getCombinedFieldValidityData");
var _useTransitionStatus = require("../../internals/useTransitionStatus");
var _jsxRuntime = require("react/jsx-runtime");
/**
 * Used to display a custom message based on the field's validity.
 * Requires `children` to be a function that accepts field validity state as an argument.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
const FieldValidity = exports.FieldValidity = function FieldValidity(props) {
  const {
    children
  } = props;
  const {
    validityData,
    invalid
  } = (0, _FieldRootContext.useFieldRootContext)(false);
  const combinedFieldValidityData = React.useMemo(() => (0, _getCombinedFieldValidityData.getCombinedFieldValidityData)(validityData, invalid), [validityData, invalid]);
  const isInvalid = combinedFieldValidityData.state.valid === false;
  const {
    transitionStatus
  } = (0, _useTransitionStatus.useTransitionStatus)(isInvalid);

  // `fieldValidityState` is handed straight to a public render prop, so its identity is observable:
  // consumers can pass it to a memoized child. Keep it stable across unrelated field-state changes
  // (focus, dirty, filled) so those children don't rerender when the validity itself is unchanged.
  const fieldValidityState = React.useMemo(() => {
    return {
      ...combinedFieldValidityData,
      validity: combinedFieldValidityData.state,
      transitionStatus
    };
  }, [combinedFieldValidityData, transitionStatus]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(React.Fragment, {
    children: children(fieldValidityState)
  });
};
if (process.env.NODE_ENV !== "production") FieldValidity.displayName = "FieldValidity";