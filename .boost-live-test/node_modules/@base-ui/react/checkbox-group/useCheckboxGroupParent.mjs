'use client';

import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
export function useCheckboxGroupParent(params) {
  const {
    allValues = EMPTY_ARRAY,
    value,
    onValueChange: onValueChangeProp
  } = params;
  const uncontrolledStateRef = React.useRef(value);
  const disabledStatesRef = React.useRef(new Map());
  const [status, setStatus] = React.useState('mixed');
  // A `Map` rather than an object: checkbox values are consumer data, and a value like
  // `constructor` would otherwise read straight off `Object.prototype`.
  // Replace only the wrapper to rerender without cloning the growing registry.
  const [childIdsState, setChildIdsState] = React.useState(() => ({
    registry: new Map()
  }));
  const checked = value.length === allValues.length;
  const indeterminate = value.length !== allValues.length && value.length > 0;
  const onValueChange = useStableCallback(onValueChangeProp);
  const registerChildId = useStableCallback((childValue, childId) => {
    const childIds = childIdsState.registry;
    const ids = childIds.get(childValue);
    if (!ids?.includes(childId)) {
      childIds.set(childValue, ids ? ids.concat(childId) : [childId]);
      setChildIdsState({
        registry: childIds
      });
    }
    return () => {
      const registeredIds = childIds.get(childValue);
      if (!registeredIds?.includes(childId)) {
        return;
      }
      const nextIds = registeredIds.filter(id => id !== childId);
      if (nextIds.length === 0) {
        childIds.delete(childValue);
      } else {
        childIds.set(childValue, nextIds);
      }
      setChildIdsState({
        registry: childIds
      });
    };
  });
  const getParentProps = React.useCallback(() => ({
    indeterminate,
    checked,
    // Children report their own rendered id, so a custom `id` survives and no unmounted
    // element is named.
    'aria-controls': allValues.flatMap(v => childIdsState.registry.get(v) ?? EMPTY_ARRAY).join(' ') || undefined,
    onCheckedChange(_, eventDetails) {
      const uncontrolledState = uncontrolledStateRef.current;

      // None except the disabled ones that are checked, which can't be changed.
      const none = allValues.filter(v => disabledStatesRef.current.get(v) && uncontrolledState.includes(v));
      // "All" that are valid:
      // - any that aren't disabled
      // - disabled ones that are checked
      const all = allValues.filter(v => !disabledStatesRef.current.get(v) || uncontrolledState.includes(v));
      const allOnOrOff = uncontrolledState.length === all.length || uncontrolledState.length === 0;
      if (allOnOrOff) {
        if (value.length === all.length) {
          onValueChange(none, eventDetails);
        } else {
          onValueChange(all, eventDetails);
        }
        return;
      }
      let nextStatus = 'mixed';
      let nextValue = uncontrolledState;
      if (status === 'mixed') {
        nextStatus = 'on';
        nextValue = all;
      } else if (status === 'on') {
        nextStatus = 'off';
        nextValue = none;
      }
      onValueChange(nextValue, eventDetails);
      if (!eventDetails.isCanceled) {
        setStatus(nextStatus);
      }
    }
  }), [allValues, checked, childIdsState, indeterminate, onValueChange, status, value.length]);
  const getChildProps = React.useCallback(childValue => ({
    checked: value.includes(childValue),
    onCheckedChange(nextChecked, eventDetails) {
      const newValue = value.slice();
      if (nextChecked) {
        newValue.push(childValue);
      } else {
        newValue.splice(newValue.indexOf(childValue), 1);
      }
      onValueChange(newValue, eventDetails);
      if (!eventDetails.isCanceled) {
        uncontrolledStateRef.current = newValue;
        setStatus('mixed');
      }
    }
  }), [onValueChange, value]);
  return React.useMemo(() => ({
    getParentProps,
    getChildProps,
    registerChildId,
    disabledStatesRef
  }), [getParentProps, getChildProps, registerChildId]);
}