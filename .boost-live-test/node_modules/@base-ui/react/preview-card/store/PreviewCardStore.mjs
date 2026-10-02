import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { applyPopupOpenChange, createInitialPopupStoreState, popupStoreSelectors, PopupTriggerMap, updateInlineRectCoords } from "../../utils/popups/index.mjs";
import { REASONS } from "../../internals/reasons.mjs";
import { NullStore } from "../../utils/NullStore.mjs";
import { CLOSE_DELAY } from "../utils/constants.mjs";
const selectors = {
  ...popupStoreSelectors,
  instantType: state => state.instantType,
  adaptiveOrigin: state => state.adaptiveOrigin,
  closeDelay: state => state.closeDelay
};

/**
 * The store view that detached handle-backed triggers read from. Both the real `PreviewCardStore`
 * and the inert fallback store satisfy it, so a trigger can read from whichever store the handle
 * currently exposes. Narrowed to the trigger-data members a trigger uses; it exposes no popup-open
 * mutator, so the inert fallback can be a plain `NullStore`.
 */

export class PreviewCardStore extends ReactStore {
  constructor(initialState, floatingId, nested) {
    const triggerElements = new PopupTriggerMap();
    super(createInitialState(initialState, triggerElements, floatingId, nested), createInitialContext(triggerElements), selectors);
  }
  setOpen = (nextOpen, eventDetails) => {
    const {
      inlineRectCoordsRef
    } = this.context;
    applyPopupOpenChange(this, nextOpen, eventDetails, {
      onBeforeDispatch() {
        // Capture the hovered inline-rect coordinates so the card anchors to the
        // exact point on the link that was hovered.
        const event = eventDetails.event;
        if (nextOpen && eventDetails.reason === REASONS.triggerHover && eventDetails.trigger && 'clientX' in event && 'clientY' in event && inlineRectCoordsRef.current?.element !== eventDetails.trigger) {
          updateInlineRectCoords(inlineRectCoordsRef, eventDetails.trigger, event.clientX, event.clientY);
        }
      }
    });
  };
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no
 * `PreviewCard.Root` is attached. It preserves a preview-card-specific trigger registry in context
 * so detached triggers can register before migrating to the live root store.
 */
export function createNullPreviewCardStore() {
  const triggerElements = new PopupTriggerMap();
  return new NullStore(Object.freeze(createInitialState(undefined, triggerElements)), Object.freeze(createInitialContext(triggerElements)), selectors);
}
function createInitialState(initialState, triggerElements, floatingId, nested = false) {
  const state = {
    ...createInitialPopupStoreState(triggerElements, floatingId, nested),
    instantType: undefined,
    adaptiveOrigin: undefined,
    closeDelay: CLOSE_DELAY,
    ...initialState
  };
  return state;
}
function createInitialContext(triggerElements) {
  return {
    popupRef: /*#__PURE__*/React.createRef(),
    onOpenChange: undefined,
    onOpenChangeComplete: undefined,
    triggerElements,
    inlineRectCoordsRef: {
      current: undefined
    }
  };
}