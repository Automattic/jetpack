import * as React from 'react';
import { ReactStore } from '@base-ui/utils/store';
import { EMPTY_OBJECT, NOOP } from '@base-ui/utils/empty';
import { FloatingTreeStore } from "../../floating-ui-react/components/FloatingTreeStore.mjs";
import { NullStore } from "../../utils/NullStore.mjs";
import { createInitialPopupStoreState, popupStoreSelectors, PopupTriggerMap } from "../../utils/popups/index.mjs";
const selectors = {
  ...popupStoreSelectors,
  disabled: state => state.parent.type === 'menubar' ? state.parent.context.disabled || state.disabled : state.disabled,
  modal: state => (state.parent.type === undefined || state.parent.type === 'context-menu') && (state.modal ?? true),
  openMethod: state => state.openMethod,
  allowMouseEnter: state => state.allowMouseEnter,
  highlightItemOnHover: state => state.highlightItemOnHover,
  parent: state => state.parent,
  rootId: state => {
    if (state.parent.type === 'menu') {
      return state.parent.store.select('rootId');
    }
    return state.parent.type !== undefined ? state.parent.context.rootId : state.rootId;
  },
  activeIndex: state => state.activeIndex,
  isActive: (state, itemIndex) => state.activeIndex === itemIndex,
  hoverEnabled: state => state.hoverEnabled,
  instantType: state => state.instantType,
  lastOpenChangeReason: state => state.openChangeReason,
  floatingTreeRoot: state => {
    if (state.parent.type === 'menu') {
      return state.parent.store.select('floatingTreeRoot');
    }
    return state.floatingTreeRoot;
  },
  floatingNodeId: state => state.floatingNodeId,
  floatingParentNodeId: state => state.floatingParentNodeId,
  itemProps: state => state.itemProps,
  closeDelay: state => state.closeDelay,
  adaptiveOrigin: state => state.adaptiveOrigin,
  keyboardEventRelay: state => {
    if (state.keyboardEventRelay) {
      return state.keyboardEventRelay;
    }
    if (state.parent.type === 'menu') {
      return state.parent.store.select('keyboardEventRelay');
    }
    return undefined;
  }
};

/**
 * The store view that detached handle-backed triggers read from. Both the real `MenuStore` and the
 * inert fallback store satisfy it, so a trigger can read from whichever store the handle currently
 * exposes. Narrowed to the members a trigger actually uses — the trigger-data members plus `setOpen`
 * (called by the focus guards) — so the exposed surface can't bypass the open-change pipeline; on
 * the detached fallback store every one of these mutations is a no-op.
 */

export class MenuStore extends ReactStore {
  constructor(initialState, floatingId, nested = false) {
    const triggerElements = new PopupTriggerMap();
    const state = createInitialState(triggerElements, floatingId, nested, initialState);
    super(state, createInitialContext(triggerElements), selectors);

    // Set up propagation of state from parent menu if applicable.
    this.unsubscribeParentListener = this.observe('parent', parent => {
      this.unsubscribeParentListener?.();
      if (parent.type === 'menu') {
        let rootId = parent.store.select('rootId');
        let floatingTreeRoot = parent.store.select('floatingTreeRoot');
        let keyboardEventRelay = parent.store.select('keyboardEventRelay');
        this.unsubscribeParentListener = parent.store.subscribe(() => {
          const nextRootId = parent.store.select('rootId');
          const nextFloatingTreeRoot = parent.store.select('floatingTreeRoot');
          const nextKeyboardEventRelay = parent.store.select('keyboardEventRelay');
          if (rootId === nextRootId && floatingTreeRoot === nextFloatingTreeRoot && keyboardEventRelay === nextKeyboardEventRelay) {
            return;
          }
          rootId = nextRootId;
          floatingTreeRoot = nextFloatingTreeRoot;
          keyboardEventRelay = nextKeyboardEventRelay;
          this.notifyAll();
        });
        this.context.allowMouseUpTriggerRef = parent.store.context.allowMouseUpTriggerRef;
        return;
      }
      if (parent.type !== undefined) {
        this.context.allowMouseUpTriggerRef = parent.context.allowMouseUpTriggerRef;
      }
      this.unsubscribeParentListener = null;
    });
  }
  setOpen(open, eventDetails) {
    this.state.floatingRootContext.context.events.emit('setOpen', {
      open,
      eventDetails
    });
  }
  unsubscribeParentListener = null;
}

/**
 * Creates the inert fallback store used by detached handle-backed triggers while no `Menu.Root` is
 * attached. It preserves a menu-specific trigger registry in context so detached triggers can
 * register before migrating to the live root store. `setOpen` is a no-op (matching the inert
 * reads/writes of `NullStore`), so a trigger can hand the store to focus-guard helpers that expect
 * `setOpen` without it ever taking effect while detached.
 */
export function createNullMenuStore() {
  const triggerElements = new PopupTriggerMap();
  const store = new NullStore(Object.freeze(createInitialState(triggerElements)), Object.freeze(createInitialContext(triggerElements)), selectors);
  return Object.assign(store, {
    setOpen: NOOP
  });
}
function createInitialContext(triggerElements) {
  return {
    positionerRef: /*#__PURE__*/React.createRef(),
    popupRef: /*#__PURE__*/React.createRef(),
    typingRef: {
      current: false
    },
    itemDomElements: {
      current: []
    },
    itemLabels: {
      current: []
    },
    allowMouseUpTriggerRef: {
      current: false
    },
    triggerFocusTargetRef: /*#__PURE__*/React.createRef(),
    beforeContentFocusGuardRef: /*#__PURE__*/React.createRef(),
    onOpenChangeComplete: undefined,
    triggerElements
  };
}
function createInitialState(triggerElements, floatingId, nested = false, initialState) {
  return {
    ...createInitialPopupStoreState(triggerElements, floatingId, nested),
    disabled: false,
    modal: true,
    openMethod: null,
    allowMouseEnter: false,
    highlightItemOnHover: true,
    parent: {
      type: undefined
    },
    rootId: undefined,
    activeIndex: null,
    hoverEnabled: true,
    instantType: undefined,
    openChangeReason: null,
    floatingTreeRoot: new FloatingTreeStore(),
    floatingNodeId: undefined,
    floatingParentNodeId: null,
    itemProps: EMPTY_OBJECT,
    keyboardEventRelay: undefined,
    closeDelay: 0,
    adaptiveOrigin: undefined,
    ...initialState
  };
}