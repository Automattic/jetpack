"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LabelableProvider = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useRefWithInit = require("@base-ui/utils/useRefWithInit");
var _useBaseUiId = require("../useBaseUiId");
var _LabelableContext = require("./LabelableContext");
var _jsxRuntime = require("react/jsx-runtime");
const LabelableProvider = exports.LabelableProvider = function LabelableProvider(props) {
  const defaultId = (0, _useBaseUiId.useBaseUiId)();
  const [controlIdState, setControlIdState] = React.useState(defaultId);
  const [labelId, setLabelId] = React.useState();
  const [messageIds, setMessageIds] = React.useState([]);

  // `undefined` only survives until the React 17 fallback id is assigned. Do not use `??`:
  // `null` deliberately suppresses `htmlFor`.
  const controlId = controlIdState === undefined ? defaultId : controlIdState;
  const registrationsRef = (0, _useRefWithInit.useRefWithInit)(() => new Map());
  const {
    messageIds: parentMessageIds
  } = (0, _LabelableContext.useLabelableContext)();
  const registerControlId = (0, _useStableCallback.useStableCallback)((source, nextId) => {
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
  const resetControlId = (0, _useStableCallback.useStableCallback)(() => {
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
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_LabelableContext.LabelableContext.Provider, {
    value: contextValue,
    children: props.children
  });
};
if (process.env.NODE_ENV !== "production") LabelableProvider.displayName = "LabelableProvider";