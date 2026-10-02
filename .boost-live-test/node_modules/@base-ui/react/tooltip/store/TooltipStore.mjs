import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { NOOP } from '@base-ui/utils/empty';
import { createChangeEventDetails } from "../../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { NullStore } from "../../utils/NullStore.mjs";
import { applyPopupOpenChange, createInitialPopupStoreState, popupStoreSelectors, PopupTriggerMap } from "../../utils/popups/index.mjs";
const selectors = {
  ...popupStoreSelectors,
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

export class TooltipStore extends ReactStore {
  constructor(initialState, floatingId, nested) {
    const triggerElements = new PopupTriggerMap();
    super(createInitialState(initialState, triggerElements, floatingId, nested), createInitialContext(triggerElements), selectors);
  }
  setOpen = (nextOpen, eventDetails) => {
    applyPopupOpenChange(this, nextOpen, eventDetails, {
      extraState: {
        openChangeReason: eventDetails.reason
      }
    });
  };

  // Used by trigger clicks to clear a delayed hover open without reporting a public open-state change.
  cancelPendingOpen(event) {
    this.state.floatingRootContext.dispatchOpenChange(false, createChangeEventDetails(REASONS.triggerPress, event));
  }
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no `Tooltip.Root`
 * is attached. It preserves a tooltip-specific trigger registry in context so detached triggers can
 * register before migrating to the live root store. `setOpen`/`cancelPendingOpen` are no-ops
 * (matching the inert reads/writes of `NullStore`), so a trigger can call them from hover/click
 * handlers while detached without any effect.
 */
export function createNullTooltipStore() {
  const triggerElements = new PopupTriggerMap();
  const store = new NullStore(Object.freeze(createInitialState(undefined, triggerElements)), Object.freeze(createInitialContext(triggerElements)), selectors);
  return Object.assign(store, {
    setOpen: NOOP,
    cancelPendingOpen: NOOP
  });
}
function createInitialState(initialState, triggerElements, floatingId, nested = false) {
  const state = {
    ...createInitialPopupStoreState(triggerElements, floatingId, nested),
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