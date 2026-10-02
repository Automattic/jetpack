'use client';

import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useFloating as usePosition } from '@floating-ui/react-dom';
import { isElement } from '@floating-ui/utils/dom';
import { useFloatingTree } from "../components/FloatingTree.mjs";
import { useFloatingRootContext } from "./useFloatingRootContext.mjs";

/**
 * Provides data to position a floating element and context to add interactions.
 * @see https://floating-ui.com/docs/useFloating
 */
export function useFloating(options = {}) {
  const internalStore = useFloatingRootContext(options);
  const store = options.rootContext || internalStore;
  return useFloatingWithStore(options, store);
}

/**
 * Base UI's private `useFloating` path. The caller must supply the root store, so this skips the
 * internal root-context hook used by the public Floating UI-compatible API.
 */
export function useBaseUIFloating(options) {
  return useFloatingWithStore(options, options.rootContext);
}
function useFloatingWithStore(options, store) {
  const {
    nodeId,
    externalTree
  } = options;
  const referenceElement = store.useState('referenceElement');
  const floatingElement = store.useState('floatingElement');
  const domReferenceElement = store.useState('domReferenceElement');
  const open = store.useState('open');
  const floatingId = store.useState('floatingId');
  const [positionReference, setPositionReferenceRaw] = React.useState(null);
  const [localDomReference, setLocalDomReference] = React.useState(undefined);
  const [localFloatingElement, setLocalFloatingElement] = React.useState(undefined);
  const domReferenceRef = React.useRef(null);
  const tree = useFloatingTree(externalTree);
  const storeElements = React.useMemo(() => ({
    reference: referenceElement,
    floating: floatingElement,
    domReference: domReferenceElement
  }), [referenceElement, floatingElement, domReferenceElement]);
  const position = usePosition({
    ...options,
    elements: {
      ...storeElements,
      ...(positionReference && {
        reference: positionReference
      })
    }
  });
  const localDomReferenceElement = isElement(localDomReference) ? localDomReference : null;
  const syncedFloatingElement = localFloatingElement === undefined ? store.state.floatingElement : localFloatingElement;
  store.useSyncedValue('referenceElement', localDomReference ?? null);
  store.useSyncedValue('domReferenceElement', localDomReference === undefined ? domReferenceElement : localDomReferenceElement);
  store.useSyncedValue('floatingElement', syncedFloatingElement);
  const setPositionReference = React.useCallback(node => {
    const computedPositionReference = isElement(node) ? {
      getBoundingClientRect: () => node.getBoundingClientRect(),
      getClientRects: () => node.getClientRects(),
      contextElement: node
    } : node;
    // Store the positionReference in state if the DOM reference is specified externally via the
    // `elements.reference` option. This ensures that it won't be overridden on future renders.
    setPositionReferenceRaw(computedPositionReference);
    position.refs.setReference(computedPositionReference);
  }, [position.refs]);
  const setReference = React.useCallback(node => {
    if (isElement(node) || node === null) {
      domReferenceRef.current = node;
      setLocalDomReference(node);
    }

    // Backwards-compatibility for passing a virtual element to `reference`
    // after it has set the DOM reference.
    if (isElement(position.refs.reference.current) || position.refs.reference.current === null ||
    // Don't allow setting virtual elements using the old technique back to
    // `null` to support `positionReference` + an unstable `reference`
    // callback ref.
    node !== null && !isElement(node)) {
      position.refs.setReference(node);
    }
  }, [position.refs, setLocalDomReference]);
  const setFloating = React.useCallback(node => {
    setLocalFloatingElement(node);
    position.refs.setFloating(node);
  }, [position.refs]);
  const refs = React.useMemo(() => ({
    ...position.refs,
    setReference,
    setFloating,
    setPositionReference,
    domReference: domReferenceRef
  }), [position.refs, setReference, setFloating, setPositionReference]);
  const elements = React.useMemo(() => ({
    ...position.elements,
    domReference: domReferenceElement
  }), [position.elements, domReferenceElement]);
  const context = React.useMemo(() => ({
    ...position,
    dataRef: store.context.dataRef,
    open,
    onOpenChange: store.setOpen,
    events: store.context.events,
    floatingId,
    refs,
    elements,
    nodeId,
    rootStore: store
  }), [position, refs, elements, nodeId, store, open, floatingId]);
  useIsoLayoutEffect(() => {
    if (domReferenceElement) {
      domReferenceRef.current = domReferenceElement;
    }
  }, [domReferenceElement]);
  useIsoLayoutEffect(() => {
    store.context.dataRef.current.floatingContext = context;
    const node = tree?.nodesRef.current.find(n => n.id === nodeId);
    if (node) {
      node.context = context;
    }
  });
  return React.useMemo(() => ({
    ...position,
    context,
    refs,
    elements,
    rootStore: store
  }), [position, refs, elements, context, store]);
}