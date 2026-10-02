"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useFloatingRootContext = useFloatingRootContext;
var _dom = require("@floating-ui/utils/dom");
var _useId = require("@base-ui/utils/useId");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useRefWithInit = require("@base-ui/utils/useRefWithInit");
var _popups = require("../../utils/popups");
var _FloatingTree = require("../components/FloatingTree");
var _FloatingRootStore = require("../components/FloatingRootStore");
function useFloatingRootContext(options) {
  const {
    open = false,
    onOpenChange,
    elements = {}
  } = options;
  const floatingId = (0, _useId.useId)();
  const nested = (0, _FloatingTree.useFloatingParentNodeId)() != null;
  if (process.env.NODE_ENV !== 'production') {
    const optionDomReference = elements.reference;
    if (optionDomReference && !(0, _dom.isElement)(optionDomReference)) {
      console.error('Cannot pass a virtual element to the `elements.reference` option,', 'as it must be a real DOM element. Use `context.setPositionReference()`', 'instead.');
    }
  }
  const store = (0, _useRefWithInit.useRefWithInit)(() => new _FloatingRootStore.FloatingRootStore({
    open,
    transitionStatus: undefined,
    onOpenChange,
    referenceElement: elements.reference ?? null,
    floatingElement: elements.floating ?? null,
    triggerElements: new _popups.PopupTriggerMap(),
    floatingId,
    syncOnly: false,
    nested
  })).current;
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    const valuesToSync = {
      open,
      floatingId
    };
    if (elements.reference !== undefined) {
      valuesToSync.referenceElement = elements.reference;
      valuesToSync.domReferenceElement = (0, _dom.isElement)(elements.reference) ? elements.reference : null;
    }
    if (elements.floating !== undefined) {
      valuesToSync.floatingElement = elements.floating;
    }
    store.update(valuesToSync);
  }, [open, floatingId, elements.reference, elements.floating, store]);
  store.context.onOpenChange = onOpenChange;
  store.context.nested = nested;
  return store;
}