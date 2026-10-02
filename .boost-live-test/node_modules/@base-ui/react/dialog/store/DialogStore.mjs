import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { NullStore } from "../../utils/NullStore.mjs";
import { createInitialPopupStoreState, popupStoreSelectors, PopupTriggerMap, createPopupOpenState } from "../../utils/popups/index.mjs";
const selectors = {
  ...popupStoreSelectors,
  modal: state => state.modal,
  nested: state => state.nested,
  nestedOpenDialogCount: state => state.nestedOpenDialogCount,
  nestedOpenDrawerCount: state => state.nestedOpenDrawerCount,
  disablePointerDismissal: state => state.disablePointerDismissal,
  openMethod: state => state.openMethod,
  descriptionElementId: state => state.descriptionElementId,
  titleElementId: state => state.titleElementId,
  viewportElement: state => state.viewportElement,
  role: state => state.role
};

/**
 * The subset of `DialogStore` that detached handle-backed triggers rely on. Both the real
 * `DialogStore` and the inert fallback store satisfy it, so a trigger can read from whichever
 * store the handle currently exposes.
 */

export class DialogStore extends ReactStore {
  constructor(initialState, floatingId, nested) {
    const triggerElements = new PopupTriggerMap();
    const state = createInitialState(initialState, triggerElements, floatingId, nested);
    super(state, createInitialContext(triggerElements), selectors);
  }
  setOpen = (nextOpen, eventDetails) => {
    eventDetails.preventUnmountOnClose = () => {
      this.set('preventUnmountingOnClose', true);
    };
    if (!nextOpen && eventDetails.trigger == null && this.state.activeTriggerId != null) {
      // When closing the dialog, pass the old trigger to the onOpenChange event
      // so it's not reset too early (potentially causing focus issues in controlled scenarios).
      eventDetails.trigger = this.state.activeTriggerElement ?? undefined;
    }
    this.context.onOpenChange?.(nextOpen, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    this.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);
    this.update(createPopupOpenState(this.state, nextOpen, eventDetails.trigger));
  };
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no
 * `Dialog.Root` is attached. It preserves a dialog-specific trigger registry in context so
 * detached triggers can register before migrating to the live root store.
 */
export function createNullDialogStore() {
  const triggerElements = new PopupTriggerMap();
  return new NullStore(Object.freeze(createInitialState(undefined, triggerElements)), Object.freeze(createInitialContext(triggerElements)), selectors);
}
function createInitialState(initialState, triggerElements, floatingId, nested = false) {
  const state = {
    ...createInitialPopupStoreState(triggerElements, floatingId, nested),
    modal: true,
    disablePointerDismissal: false,
    viewportElement: null,
    descriptionElementId: undefined,
    titleElementId: undefined,
    openMethod: null,
    nested: false,
    nestedOpenDialogCount: 0,
    nestedOpenDrawerCount: 0,
    role: 'dialog',
    ...initialState
  };
  return state;
}
function createInitialContext(triggerElements) {
  return {
    popupRef: /*#__PURE__*/React.createRef(),
    backdropRef: /*#__PURE__*/React.createRef(),
    internalBackdropRef: /*#__PURE__*/React.createRef(),
    outsidePressEnabledRef: {
      current: true
    },
    triggerElements,
    onOpenChange: undefined,
    onOpenChangeComplete: undefined
  };
}