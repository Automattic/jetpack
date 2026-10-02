"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useLabelableId = useLabelableId;
var React = _interopRequireWildcard(require("react"));
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useRefWithInit = require("@base-ui/utils/useRefWithInit");
var _noop = require("../noop");
var _useBaseUiId = require("../useBaseUiId");
var _LabelableContext = require("./LabelableContext");
function useLabelableId(params = {}) {
  const {
    id,
    enabled = true
  } = params;
  const {
    controlId,
    registerControlId,
    resetControlId
  } = (0, _LabelableContext.useLabelableContext)();

  // Deliberately not seeded with `id`: on React 17 the seed would stick around after the
  // `id` prop is removed, leaving the control on a stale id forever.
  const defaultId = (0, _useBaseUiId.useBaseUiId)();
  const controlSourceRef = (0, _useRefWithInit.useRefWithInit)(() => Symbol());
  const hasRegisteredRef = React.useRef(false);
  const hadExplicitIdRef = React.useRef(false);
  const unregisterControlId = (0, _useStableCallback.useStableCallback)(() => {
    if (!hasRegisteredRef.current || registerControlId === _noop.NOOP) {
      return;
    }
    hasRegisteredRef.current = false;
    registerControlId(controlSourceRef.current, undefined);
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!enabled || registerControlId === _noop.NOOP) {
      unregisterControlId();
      return undefined;
    }
    let nextId;
    if (id !== undefined) {
      hadExplicitIdRef.current = true;
      nextId = id;
    } else if (hadExplicitIdRef.current) {
      nextId = defaultId;
    } else {
      // An id-less replacement must claim the provider's fallback so a previously registered
      // explicit id is not retained after its control unmounts.
      resetControlId();
      return undefined;
    }

    // Either the control never had an explicit `id`, or React 17 has not assigned the
    // fallback id yet. Neither is worth registering.
    if (nextId === undefined) {
      unregisterControlId();
      return undefined;
    }
    hasRegisteredRef.current = true;
    registerControlId(controlSourceRef.current, nextId);
    return undefined;
  }, [id, enabled, registerControlId, resetControlId, defaultId, controlSourceRef, unregisterControlId]);

  // Unregistering in the layout phase, not a passive effect: a replacement control's layout
  // effect would otherwise run first and still see the outgoing control's registration.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    return unregisterControlId;
  }, [unregisterControlId]);

  // The provider's id wins until registration runs: the label renders `htmlFor` from the
  // provider's pre-registration state, so preempting it with an explicit `id` here would
  // leave the pair unassociated in server-rendered markup.
  return (enabled ? controlId : undefined) ?? id ?? defaultId;
}