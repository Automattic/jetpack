"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TooltipStore = void 0;
exports.createNullTooltipStore = createNullTooltipStore;
var React = _interopRequireWildcard(require("react"));
var _store = require("@base-ui/utils/store");
var _empty = require("@base-ui/utils/empty");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _NullStore = require("../../utils/NullStore");
var _popups = require("../../utils/popups");
const selectors = {
  ..._popups.popupStoreSelectors,
  disabled: state => state.disabled,
  instantType: state => state.instantType,
  isInstantPhase: state => state.isInstantPhase,
  trackCursorAxis: state => state.trackCursorAxis,
  disableHoverablePopup: state => state.disableHoverablePopup,
  lastOpenChangeReason: state => state.openChangeReason,
  closeOnClick: state => state.closeOnClick,
  closeDelay: state => state.closeDelay,
  adaptiveOrigin: state => state.adaptiveOrigin
};

/**
 * The store view that detached handle-backed triggers read from. Both the real `TooltipStore` and
 * the inert fallback store satisfy it, so a trigger can read from whichever store the handle
 * currently exposes. Narrowed to the members a trigger actually uses — the trigger-data members plus
 * `setOpen`/`cancelPendingOpen` (called directly by the trigger) and `useSyncedValue` — so the
 * exposed surface can't bypass the open-change pipeline; on the detached fallback store every one of
 * these mutations is a no-op.
 */

class TooltipStore extends _store.ReactStore {
  constructor(initialState, floatingId, nested) {
    const triggerElements = new _popups.PopupTriggerMap();
    super(createInitialState(initialState, triggerElements, floatingId, nested), createInitialContext(triggerElements), selectors);
  }
  setOpen = (nextOpen, eventDetails) => {
    (0, _popups.applyPopupOpenChange)(this, nextOpen, eventDetails, {
      extraState: {
        openChangeReason: eventDetails.reason
      }
    });
  };

  // Used by trigger clicks to clear a delayed hover open without reporting a public open-state change.
  cancelPendingOpen(event) {
    this.state.floatingRootContext.dispatchOpenChange(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.triggerPress, event));
  }
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no `Tooltip.Root`
 * is attached. It preserves a tooltip-specific trigger registry in context so detached triggers can
 * register before migrating to the live root store. `setOpen`/`cancelPendingOpen` are no-ops
 * (matching the inert reads/writes of `NullStore`), so a trigger can call them from hover/click
 * handlers while detached without any effect.
 */
exports.TooltipStore = TooltipStore;
function createNullTooltipStore() {
  const triggerElements = new _popups.PopupTriggerMap();
  const store = new _NullStore.NullStore(Object.freeze(createInitialState(undefined, triggerElements)), Object.freeze(createInitialContext(triggerElements)), selectors);
  return Object.assign(store, {
    setOpen: _empty.NOOP,
    cancelPendingOpen: _empty.NOOP
  });
}
function createInitialState(initialState, triggerElements, floatingId, nested = false) {
  const state = {
    ...(0, _popups.createInitialPopupStoreState)(triggerElements, floatingId, nested),
    disabled: false,
    instantType: undefined,
    isInstantPhase: false,
    trackCursorAxis: 'none',
    disableHoverablePopup: false,
    openChangeReason: null,
    closeOnClick: true,
    closeDelay: 0,
    adaptiveOrigin: undefined,
    ...initialState
  };
  return state;
}
function createInitialContext(triggerElements) {
  return {
    popupRef: /*#__PURE__*/React.createRef(),
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
    triggerElements
  };
}