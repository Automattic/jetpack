"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FormContext = void 0;
exports.useFormContext = useFormContext;
var React = _interopRequireWildcard(require("react"));
var _noop = require("../noop");
const FormContext = exports.FormContext = /*#__PURE__*/React.createContext({
  elementRef: {
    current: null
  },
  formRef: {
    current: {
      fields: new Map()
    }
  },
  errors: {},
  clearErrors: _noop.NOOP,
  validationMode: 'onSubmit',
  submitCountRef: {
    current: 0
  }
});
if (process.env.NODE_ENV !== "production") FormContext.displayName = "FormContext";
function useFormContext() {
  return React.useContext(FormContext);
}