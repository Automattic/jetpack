"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PreviewCardStore = void 0;
exports.createNullPreviewCardStore = createNullPreviewCardStore;
var React = _interopRequireWildcard(require("react"));
var _store = require("@base-ui/utils/store");
var _popups = require("../../utils/popups");
var _reasons = require("../../internals/reasons");
var _NullStore = require("../../utils/NullStore");
var _constants = require("../utils/constants");
const selectors = {
  ..._popups.popupStoreSelectors,
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

class PreviewCardStore extends _store.ReactStore {
  constructor(initialState, floatingId, nested) {
    const triggerElements = new _popups.PopupTriggerMap();
    super(createInitialState(initialState, triggerElements, floatingId, nested), createInitialContext(triggerElements), selectors);
  }
  setOpen = (nextOpen, eventDetails) => {
    const {
      inlineRectCoordsRef
    } = this.context;
    (0, _popups.applyPopupOpenChange)(this, nextOpen, eventDetails, {
      onBeforeDispatch() {
        // Capture the hovered inline-rect coordinates so the card anchors to the
        // exact point on the link that was hovered.
        const event = eventDetails.event;
        if (nextOpen && eventDetails.reason === _reasons.REASONS.triggerHover && eventDetails.trigger && 'clientX' in event && 'clientY' in event && inlineRectCoordsRef.current?.element !== eventDetails.trigger) {
          (0, _popups.updateInlineRectCoords)(inlineRectCoordsRef, eventDetails.trigger, event.clientX, event.clientY);
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
exports.PreviewCardStore = PreviewCardStore;
function createNullPreviewCardStore() {
  const triggerElements = new _popups.PopupTriggerMap();
  return new _NullStore.NullStore(Object.freeze(createInitialState(undefined, triggerElements)), Object.freeze(createInitialContext(triggerElements)), selectors);
}
function createInitialState(initialState, triggerElements, floatingId, nested = false) {
  const state = {
    ...(0, _popups.createInitialPopupStoreState)(triggerElements, floatingId, nested),
    instantType: undefined,
    adaptiveOrigin: undefined,
    closeDelay: _constants.CLOSE_DELAY,
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