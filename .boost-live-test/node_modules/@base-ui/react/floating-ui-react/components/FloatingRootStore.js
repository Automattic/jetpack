"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FloatingRootStore = void 0;
var _store = require("@base-ui/utils/store");
var _createEventEmitter = require("../utils/createEventEmitter");
var _utils = require("../utils");
const selectors = {
  open: state => state.open,
  transitionStatus: state => state.transitionStatus,
  domReferenceElement: state => state.domReferenceElement,
  referenceElement: state => state.positionReference ?? state.referenceElement,
  floatingElement: state => state.floatingElement,
  floatingId: state => state.floatingId
};
class FloatingRootStore extends _store.ReactStore {
  constructor(options) {
    const {
      syncOnly,
      nested,
      onOpenChange,
      triggerElements,
      ...initialState
    } = options;
    super({
      ...initialState,
      positionReference: initialState.referenceElement,
      domReferenceElement: initialState.referenceElement
    }, {
      onOpenChange,
      dataRef: {
        current: {}
      },
      events: (0, _createEventEmitter.createEventEmitter)(),
      nested,
      triggerElements
    }, selectors);
    this.syncOnly = syncOnly;
  }

  /**
   * Syncs the event used by hover logic to distinguish hover-open from click-like interaction.
   */
  syncOpenEvent = (newOpen, event) => {
    if (!newOpen || !this.state.open ||
    // Prevent a pending hover-open from overwriting a click-open event, while allowing
    // click events to upgrade a hover-open.
    event != null && (0, _utils.isClickLikeEvent)(event)) {
      this.context.dataRef.current.openEvent = newOpen ? event : undefined;
    }
  };

  /**
   * Runs the root-owned side effects for an open state change.
   */
  dispatchOpenChange = (newOpen, eventDetails) => {
    this.syncOpenEvent(newOpen, eventDetails.event);
    const details = {
      open: newOpen,
      reason: eventDetails.reason,
      nativeEvent: eventDetails.event,
      nested: this.context.nested,
      triggerElement: eventDetails.trigger
    };
    this.context.events.emit('openchange', details);
  };

  /**
   * Emits the `openchange` event through the internal event emitter and calls the `onOpenChange` handler with the provided arguments.
   *
   * @param newOpen The new open state.
   * @param eventDetails Details about the event that triggered the open state change.
   */
  setOpen = (newOpen, eventDetails) => {
    if (this.syncOnly) {
      this.context.onOpenChange?.(newOpen, eventDetails);
      return;
    }
    this.dispatchOpenChange(newOpen, eventDetails);
    this.context.onOpenChange?.(newOpen, eventDetails);
  };
}
exports.FloatingRootStore = FloatingRootStore;