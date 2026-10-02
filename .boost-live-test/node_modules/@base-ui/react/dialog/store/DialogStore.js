"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DialogStore = void 0;
exports.createNullDialogStore = createNullDialogStore;
var React = _interopRequireWildcard(require("react"));
var _store = require("@base-ui/utils/store");
var _NullStore = require("../../utils/NullStore");
var _popups = require("../../utils/popups");
const selectors = {
  ..._popups.popupStoreSelectors,
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

class DialogStore extends _store.ReactStore {
  constructor(initialState, floatingId, nested) {
    const triggerElements = new _popups.PopupTriggerMap();
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
    this.update((0, _popups.createPopupOpenState)(this.state, nextOpen, eventDetails.trigger));
  };
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no
 * `Dialog.Root` is attached. It preserves a dialog-specific trigger registry in context so
 * detached triggers can register before migrating to the live root store.
 */
exports.DialogStore = DialogStore;
function createNullDialogStore() {
  const triggerElements = new _popups.PopupTriggerMap();
  return new _NullStore.NullStore(Object.freeze(createInitialState(undefined, triggerElements)), Object.freeze(createInitialContext(triggerElements)), selectors);
}
function createInitialState(initialState, triggerElements, floatingId, nested = false) {
  const state = {
    ...(0, _popups.createInitialPopupStoreState)(triggerElements, floatingId, nested),
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