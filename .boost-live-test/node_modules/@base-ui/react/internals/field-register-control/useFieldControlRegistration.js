"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useFieldControlRegistration = useFieldControlRegistration;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _getCombinedFieldValidityData = require("../../field/utils/getCombinedFieldValidityData");
var _FormContext = require("../form-context/FormContext");
function useFieldControlRegistration(params) {
  const {
    change,
    commit,
    invalid,
    markedDirtyRef,
    name,
    setRegisteredFieldName,
    registeredFieldIdRef,
    setValidityData,
    validityData
  } = params;
  const {
    formRef
  } = (0, _FormContext.useFormContext)();
  const activeFieldControlSourceRef = React.useRef(null);
  const registrationRef = React.useRef(null);
  const initialValueCapturedRef = React.useRef(false);
  const getValueForForm = (0, _useStableCallback.useStableCallback)(() => {
    const registration = registrationRef.current;
    if (!registration) {
      return undefined;
    }
    if (registration.getValue) {
      return registration.getValue();
    }
    return registration.value;
  });
  function getRegistrationValue(registration) {
    return registration.value === undefined ? getValueForForm() : registration.value;
  }
  const validate = (0, _useStableCallback.useStableCallback)(() => {
    const registration = registrationRef.current;
    markedDirtyRef.current = true;
    if (!registration) {
      commit(validityData.value);
      return;
    }
    commit(getRegistrationValue(registration));
  });
  function refreshRegistration() {
    const registration = registrationRef.current;
    if (!registration || !registration.id) {
      return;
    }
    formRef.current.fields.set(registration.id, {
      getValue: getValueForForm,
      name: name ?? registration.name,
      controlRef: registration.controlRef,
      validityData: (0, _getCombinedFieldValidityData.getCombinedFieldValidityData)(validityData, invalid),
      validate
    });
  }
  function deleteRegistration(id = registrationRef.current?.id) {
    if (id) {
      formRef.current.fields.delete(id);
    }
  }

  // The baseline belongs to the field, not to a control instance: registration re-runs on every
  // value change, and a control that unmounts and remounts (or is swapped for another one) comes
  // back as a brand new registration. Capturing more than once would turn whichever value the
  // control happens to hold at that point into the initial value, so a modified field would read
  // pristine and its real initial value would read dirty. Consumers that want a fresh baseline
  // remount or key `<Field.Root>` itself.
  function captureInitialValue(registration) {
    if (initialValueCapturedRef.current) {
      return;
    }
    initialValueCapturedRef.current = true;
    const initialValue = getRegistrationValue(registration);
    setValidityData(prev => prev.initialValue === initialValue ? prev : {
      ...prev,
      initialValue
    });
  }
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const registration = registrationRef.current;
    if (!registration || !registration.id) {
      return;
    }
    setRegisteredFieldName(name ? undefined : registration.name);
    formRef.current.fields.set(registration.id, {
      getValue: getValueForForm,
      name: name ?? registration.name,
      controlRef: registration.controlRef,
      validityData: (0, _getCombinedFieldValidityData.getCombinedFieldValidityData)(validityData, invalid),
      validate
    });
  }, [formRef, getValueForForm, invalid, name, setRegisteredFieldName, validate, validityData]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const fields = formRef.current.fields;
    return () => {
      const id = registrationRef.current?.id;
      if (id) {
        fields.delete(id);
      }
    };
  }, [formRef]);
  const register = (0, _useStableCallback.useStableCallback)((source, registration) => {
    if (!registration) {
      if (activeFieldControlSourceRef.current === source) {
        activeFieldControlSourceRef.current = null;
        change(undefined, true);
        deleteRegistration();
        registrationRef.current = null;
        setRegisteredFieldName(undefined);
        registeredFieldIdRef.current = undefined;
      }
      return;
    }
    const previousId = registrationRef.current?.id;
    const previousSource = activeFieldControlSourceRef.current;

    // Drop work owned by a replaced control, but not on first registration.
    if (previousSource && previousSource !== source) {
      change(undefined, true);
    }
    activeFieldControlSourceRef.current = source;
    registrationRef.current = registration;
    if (!name) {
      setRegisteredFieldName(registration.name);
    }
    registeredFieldIdRef.current = registration.id;
    if (previousId && previousId !== registration.id) {
      deleteRegistration(previousId);
    }
    captureInitialValue(registration);
    refreshRegistration();
  });
  return [validate, register];
}