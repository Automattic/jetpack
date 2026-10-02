"use strict";
'use client';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HoverInteraction = void 0;
exports.applySafePolygonPointerEventsMutation = applySafePolygonPointerEventsMutation;
exports.clearSafePolygonPointerEventsMutation = clearSafePolygonPointerEventsMutation;
Object.defineProperty(exports, "isInteractiveElement", {
  enumerable: true,
  get: function () {
    return _utils.isInteractiveElement;
  }
});
exports.useHoverInteractionSharedState = useHoverInteractionSharedState;
var _useOnMount = require("@base-ui/utils/useOnMount");
var _useRefWithInit = require("@base-ui/utils/useRefWithInit");
var _useTimeout = require("@base-ui/utils/useTimeout");
var _utils = require("../utils");
class HoverInteraction {
  constructor() {
    this.pointerType = undefined;
    this.interactedInside = false;
    this.handler = undefined;
    this.blockMouseMove = true;
    this.performedPointerEventsMutation = false;
    this.pointerEventsScopeElement = null;
    this.pointerEventsReferenceElement = null;
    this.pointerEventsFloatingElement = null;
    this.restTimeoutPending = false;
    this.openChangeTimeout = new _useTimeout.Timeout();
    this.restTimeout = new _useTimeout.Timeout();
    this.handleCloseOptions = undefined;
  }
  static create() {
    return new HoverInteraction();
  }
  dispose = () => {
    this.openChangeTimeout.clear();
    this.restTimeout.clear();
  };
  disposeEffect = () => {
    return this.dispose;
  };
}
exports.HoverInteraction = HoverInteraction;
const pointerEventsMutationOwnerByScopeElement = new WeakMap();
function clearSafePolygonPointerEventsMutation(instance) {
  if (!instance.performedPointerEventsMutation) {
    return;
  }
  const scopeElement = instance.pointerEventsScopeElement;
  if (scopeElement && pointerEventsMutationOwnerByScopeElement.get(scopeElement) === instance) {
    instance.pointerEventsScopeElement?.style.removeProperty('pointer-events');
    instance.pointerEventsReferenceElement?.style.removeProperty('pointer-events');
    instance.pointerEventsFloatingElement?.style.removeProperty('pointer-events');
    pointerEventsMutationOwnerByScopeElement.delete(scopeElement);
  }
  instance.performedPointerEventsMutation = false;
  instance.pointerEventsScopeElement = null;
  instance.pointerEventsReferenceElement = null;
  instance.pointerEventsFloatingElement = null;
}
function applySafePolygonPointerEventsMutation(instance, options) {
  const {
    scopeElement,
    referenceElement,
    floatingElement
  } = options;
  const existingOwner = pointerEventsMutationOwnerByScopeElement.get(scopeElement);
  if (existingOwner && existingOwner !== instance) {
    clearSafePolygonPointerEventsMutation(existingOwner);
  }
  clearSafePolygonPointerEventsMutation(instance);
  instance.performedPointerEventsMutation = true;
  instance.pointerEventsScopeElement = scopeElement;
  instance.pointerEventsReferenceElement = referenceElement;
  instance.pointerEventsFloatingElement = floatingElement;
  pointerEventsMutationOwnerByScopeElement.set(scopeElement, instance);
  scopeElement.style.pointerEvents = 'none';
  referenceElement.style.pointerEvents = 'auto';
  floatingElement.style.pointerEvents = 'auto';
}
function useHoverInteractionSharedState(store) {
  const data = store.context.dataRef.current;
  const instance = (0, _useRefWithInit.useRefWithInit)(() => data.hoverInteractionState ?? HoverInteraction.create()).current;
  if (!data.hoverInteractionState) {
    data.hoverInteractionState = instance;
  }
  (0, _useOnMount.useOnMount)(data.hoverInteractionState.disposeEffect);
  return data.hoverInteractionState;
}