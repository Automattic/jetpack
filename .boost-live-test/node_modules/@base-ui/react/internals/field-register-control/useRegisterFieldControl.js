"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useRegisterFieldControl = useRegisterFieldControl;
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useRefWithInit = require("@base-ui/utils/useRefWithInit");
var _FieldRootContext = require("../field-root-context/FieldRootContext");
function useRegisterFieldControl(controlRef, id, value, getFormValueOverride, enabled = true, name) {
  const {
    registerFieldControl
  } = (0, _FieldRootContext.useFieldRootContext)();
  const sourceRef = (0, _useRefWithInit.useRefWithInit)(() => Symbol());

  // Re-register without unregistering first: re-registration with the same id updates the
  // form's fields Map entry in place, while a delete + re-add would move the field to the
  // end of the Map every time its value changes.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const source = sourceRef.current;
    if (!enabled) {
      registerFieldControl(source, undefined);
      return;
    }
    const registration = {
      controlRef,
      getValue: getFormValueOverride,
      id,
      name,
      value
    };
    registerFieldControl(source, registration);
  }, [controlRef, enabled, getFormValueOverride, id, name, registerFieldControl, sourceRef, value]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const source = sourceRef.current;
    return () => {
      registerFieldControl(source, undefined);
    };
  }, [registerFieldControl, sourceRef]);
}