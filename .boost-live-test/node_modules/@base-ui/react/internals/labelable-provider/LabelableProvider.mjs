'use client';

import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useBaseUiId } from "../useBaseUiId.mjs";
import { LabelableContext, useLabelableContext } from "./LabelableContext.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
export const LabelableProvider = function LabelableProvider(props) {
  const defaultId = useBaseUiId();
  const [controlIdState, setControlIdState] = React.useState(defaultId);
  const [labelId, setLabelId] = React.useState();
  const [messageIds, setMessageIds] = React.useState([]);

  // `undefined` only survives until the React 17 fallback id is assigned. Do not use `??`:
  // `null` deliberately suppresses `htmlFor`.
  const controlId = controlIdState === undefined ? defaultId : controlIdState;
  const registrationsRef = useRefWithInit(() => new Map());
  const {
    messageIds: parentMessageIds
  } = useLabelableContext();
  const registerControlId = useStableCallback((source, nextId) => {
    const registrations = registrationsRef.current;
    if (nextId === undefined) {
      registrations.delete(source);
    } else {
      registrations.set(source, nextId);
    }
    setControlIdState(prev => {
      if (registrations.size === 0) {
        // A hidden subtree (React Activity, a re-suspending Suspense) destroys effects but keeps
        // its DOM, so preserve its selected control.
        return prev;
      }
      let nextControlId;
      for (const id of registrations.values()) {
        // Keep the current selection while it is still registered, so rapid unmount/remount
        // cycles don't churn it.
        if (id === prev) {
          return prev;
        }
        if (nextControlId === undefined) {
          nextControlId = id;
        }
      }
      return nextControlId;
    });
  });
  const resetControlId = useStableCallback(() => {
    if (registrationsRef.current.size === 0) {
      setControlIdState(defaultId);
    }
  });
  const getDescriptionProps = React.useCallback(externalProps => {
    const ids = externalProps['aria-describedby'] ? externalProps['aria-describedby'].split(' ') : [];
    ids.push(...parentMessageIds, ...messageIds);
    return {
      ...externalProps,
      'aria-describedby': Array.from(new Set(ids)).join(' ') || undefined
    };
  }, [parentMessageIds, messageIds]);
  const contextValue = React.useMemo(() => ({
    controlId,
    registerControlId,
    resetControlId,
    labelId,
    setLabelId,
    messageIds,
    setMessageIds,
    getDescriptionProps
  }), [controlId, registerControlId, resetControlId, labelId, setLabelId, messageIds, setMessageIds, getDescriptionProps]);
  return /*#__PURE__*/_jsx(LabelableContext.Provider, {
    value: contextValue,
    children: props.children
  });
};
if (process.env.NODE_ENV !== "production") LabelableProvider.displayName = "LabelableProvider";