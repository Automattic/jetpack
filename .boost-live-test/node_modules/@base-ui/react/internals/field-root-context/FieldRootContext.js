"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FieldRootContext = exports.DEFAULT_FIELD_ROOT_CONTEXT = void 0;
exports.useFieldRootContext = useFieldRootContext;
var _formatErrorMessage2 = _interopRequireDefault(require("@base-ui/utils/formatErrorMessage"));
var React = _interopRequireWildcard(require("react"));
var _empty = require("@base-ui/utils/empty");
var _noop = require("../noop");
var _constants = require("../field-constants/constants");
const DEFAULT_FIELD_ROOT_CONTEXT = exports.DEFAULT_FIELD_ROOT_CONTEXT = {
  invalid: undefined,
  name: undefined,
  validityData: {
    state: _constants.DEFAULT_VALIDITY_STATE,
    errors: [],
    error: '',
    value: '',
    initialValue: null
  },
  setValidityData: _noop.NOOP,
  disabled: undefined,
  setTouched: _noop.NOOP,
  setDirty: _noop.NOOP,
  setFilled: _noop.NOOP,
  setFocused: _noop.NOOP,
  validationMode: 'onSubmit',
  shouldValidateOnChange: () => false,
  state: _constants.DEFAULT_FIELD_ROOT_STATE,
  registerFieldControl: _noop.NOOP,
  validation: {
    getValidationProps: (_disabled, props = _empty.EMPTY_OBJECT) => props,
    inputRef: {
      current: null
    },
    registeredInputs: new Map(),
    registerInput: _noop.NOOP,
    getInputControl: () => null,
    commit: async () => {},
    change: _noop.NOOP
  }
};
const FieldRootContext = exports.FieldRootContext = /*#__PURE__*/React.createContext(DEFAULT_FIELD_ROOT_CONTEXT);
if (process.env.NODE_ENV !== "production") FieldRootContext.displayName = "FieldRootContext";
function useFieldRootContext(optional = true) {
  const context = React.useContext(FieldRootContext);
  if (context.setValidityData === _noop.NOOP && !optional) {
    throw new Error(process.env.NODE_ENV !== "production" ? 'Base UI: FieldRootContext is missing. Field parts must be placed within <Field.Root>.' : (0, _formatErrorMessage2.default)(28));
  }
  return context;
}