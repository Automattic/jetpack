'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ReactStore } from '@base-ui/utils/store';
import { Timeout } from '@base-ui/utils/useTimeout';
import { NOOP } from '@base-ui/utils/empty';
import { REASONS } from "../../internals/reasons.mjs";
import { NullStore } from "../../utils/NullStore.mjs";
import { attachPreventUnmountOnClose, createInitialPopupStoreState, popupStoreSelectors, PopupTriggerMap, createPopupOpenState } from "../../utils/popups/index.mjs";
import { PATIENT_CLICK_THRESHOLD } from "../../internals/constants.mjs";
const selectors = {
  ...popupStoreSelectors,
  disabled: state => state.disabled,
  instantType: state => state.instantType,
  openMethod: state => state.openMethod,
  openChangeReason: state => state.openChangeReason,
  modal: state => state.modal,
  focusManagerModal: state => state.focusManagerModal,
  stickIfOpen: state => state.stickIfOpen,
  titleElementId: state => state.titleElementId,
  descriptionElementId: state => state.descriptionElementId,
  openOnHover: state => state.openOnHover,
  closeDelay: state => state.closeDelay,
  adaptiveOrigin: state => state.adaptiveOrigin
};

/**
 * The store view that detached handle-backed triggers read from. Both the real `PopoverStore` and
 * the inert fallback store satisfy it, so a trigger can read from whichever store the handle
 * currently exposes. Narrowed to the members a trigger actually uses — the trigger-data members plus
 * `setOpen` (called by the focus guards) — so the exposed surface can't bypass the open-change
 * pipeline; on the detached fallback store every one of these mutations is a no-op.
 */

export class PopoverStore extends ReactStore {
  constructor(initialState, floatingId, nested) {
    const triggerElements = new PopupTriggerMap();
    super(createInitialState(initialState, triggerElements, floatingId, nested), createInitialContext(triggerElements), selectors);
  }
  setOpen = (nextOpen, eventDetails) => {
    const isHover = eventDetails.reason === REASONS.triggerHover;
    const isKeyboardClick = eventDetails.reason === REASONS.triggerPress && eventDetails.event.detail === 0;
    const isDismissClose = !nextOpen && (eventDetails.reason === REASONS.escapeKey || eventDetails.reason == null);
    const shouldPreventUnmountOnClose = attachPreventUnmountOnClose(eventDetails);
    const activeTriggerId = this.select('activeTriggerId');
    if (!nextOpen && eventDetails.reason === REASONS.closePress && eventDetails.trigger == null && activeTriggerId != null) {
      eventDetails.trigger = this.context.triggerElements.getById(activeTriggerId) ?? this.select('activeTriggerElement') ?? undefined;
    }
    this.context.onOpenChange?.(nextOpen, eventDetails);
    if (eventDetails.isCanceled) {
      return;
    }
    this.state.floatingRootContext.dispatchOpenChange(nextOpen, eventDetails);
    const changeState = () => {
      const popupOpenState = createPopupOpenState(this.state, nextOpen, eventDetails.trigger, shouldPreventUnmountOnClose());
      popupOpenState.openChangeReason = eventDetails.reason;
      this.update(popupOpenState);
    };
    if (isHover) {
      // Only allow "patient" clicks to close the popover if it's open.
      // If they clicked within 500ms of the popover opening, keep it open.
      this.set('stickIfOpen', true);
      this.context.stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
        this.set('stickIfOpen', false);
      });
      ReactDOM.flushSync(changeState);
    } else {
      changeState();
    }
    let instantType;
    if (isKeyboardClick) {
      instantType = 'click';
    } else if (isDismissClose) {
      instantType = 'dismiss';
    } else if (eventDetails.reason === REASONS.focusOut) {
      instantType = 'focus';
    }
    this.set('instantType', instantType);
  };
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no
 * `Popover.Root` is attached. It preserves a popover-specific trigger registry in context so
 * detached triggers can register before migrating to the live root store. `setOpen` is a no-op
 * (matching the inert reads/writes of `NullStore`), so a trigger can hand the store to focus-guard
 * helpers that expect `setOpen` without it ever taking effect while detached.
 */
export function createNullPopoverStore() {
  const triggerElements = new PopupTriggerMap();
  const store = new NullStore(Object.freeze(createInitialState(undefined, triggerElements)), Object.freeze(createInitialContext(triggerElements)), selectors);
  return Object.assign(store, {
    setOpen: NOOP
  });
}
function createInitialState(initialState, triggerElements, floatingId, nested = false) {
  const state = {
    ...createInitialPopupStoreState(triggerElements, floatingId, nested),
    disabled: false,
    modal: false,
    focusManagerModal: false,
    instantType: undefined,
    openMethod: null,
    openChangeReason: null,
    titleElementId: undefined,
    descriptionElementId: undefined,
    stickIfOpen: true,
    openOnHover: false,
    closeDelay: 0,
    adaptiveOrigin: undefined,
    ...initialState
  };
  if (state.open && initialState?.mounted === undefined) {
    state.mounted = true;
  }
  return state;
}
function createInitialContext(triggerElements) {
  return {
    popupRef: /*#__PURE__*/React.createRef(),
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
    triggerFocusTargetRef: /*#__PURE__*/React.createRef(),
    beforeContentFocusGuardRef: /*#__PURE__*/React.createRef(),
    stickIfOpenTimeout: new Timeout(),
    triggerElements
  };
}