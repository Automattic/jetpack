/* eslint-disable no-bitwise */
'use client';

import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { CompositeListContext } from "./CompositeListContext.mjs";
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Provides context for a list of items in a composite component.
 */
export function CompositeList(props) {
  const {
    children,
    elementsRef,
    labelsRef,
    onMapChange: onMapChangeProp
  } = props;
  const onMapChange = useStableCallback(onMapChangeProp);
  const [, setMapTick] = React.useState(false);
  const listeners = useRefWithInit(createListeners).current;
  const map = useRefWithInit(createMap).current;
  const nextIndexRef = React.useRef(0);
  const isDirtyRef = React.useRef(true);
  const itemsRef = React.useRef(null);
  const mutationObserverRef = React.useRef(null);

  // Item effects can run without their parent rendering. Schedule one synchronous
  // parent update for the whole commit so refs are rebuilt before paint and while
  // the originating React event is still inside `act()` in tests.
  const scheduleMapUpdate = useStableCallback(() => {
    if (isDirtyRef.current) {
      return;
    }
    isDirtyRef.current = true;
    setMapTick(tick => !tick);
  });
  const register = useStableCallback((node, registration) => {
    map.set(node, registration);
    scheduleMapUpdate();
  });
  const unregister = useStableCallback(node => {
    map.delete(node);
    scheduleMapUpdate();
  });
  const syncRefs = useStableCallback(items => {
    const nextMap = new Map();
    elementsRef.current.length = 0;
    if (labelsRef) {
      labelsRef.current.length = 0;
    }
    items.forEach(item => {
      nextMap.set(item.element, {
        ...(item.registration.metadata ?? {}),
        index: item.index
      });
      elementsRef.current[item.index] = item.element;
      if (labelsRef) {
        labelsRef.current[item.index] = item.registration.label !== undefined ? item.registration.label : item.registration.textRef?.current?.textContent ?? item.element.textContent;
      }
    });
    nextIndexRef.current = elementsRef.current.length;
    return nextMap;
  });
  function observe(sortedNodes) {
    mutationObserverRef.current?.disconnect();
    mutationObserverRef.current = null;

    // A single item can't reorder.
    if (typeof MutationObserver !== 'function' || sortedNodes.length < 2) {
      return;
    }
    const mutationObserver = new MutationObserver(entries => {
      // Only verify the order after a move: a node that was removed and later
      // re-added within the same batch. Additions and removals alone can't
      // change the relative order of the remaining items, and items that mount
      // or unmount re-sort through `register`/`unregister`.
      if (!hasMovedNode(entries)) {
        return;
      }
      let previousConnectedNode = null;

      // If any connected node now appears before the previous connected node,
      // wrappers/items moved and the index map needs to be rebuilt.
      for (const node of sortedNodes) {
        if (!node.isConnected) {
          continue;
        }
        if (previousConnectedNode && sortByDocumentPosition(previousConnectedNode, node) > 0) {
          mutationObserver.disconnect();
          scheduleMapUpdate();
          return;
        }
        previousConnectedNode = node;
      }
    });
    mutationObserverRef.current = mutationObserver;

    // A reorder that changes item indexes must invert at least one adjacent pair
    // from the previous sorted order. Observing each pair's common parent catches
    // both direct item moves and ancestor wrapper moves at the boundary.
    const roots = new Set();
    for (let i = 1; i < sortedNodes.length; i += 1) {
      const root = getCommonAncestor(sortedNodes[i - 1], sortedNodes[i]);
      if (root) {
        roots.add(root);
      }
    }
    roots.forEach(root => mutationObserver.observe(root, {
      childList: true
    }));
  }
  const flush = useStableCallback(() => {
    const [items, automaticNodes] = getCompositeListSnapshot(map);
    const nextMap = syncRefs(items);
    const previousItems = itemsRef.current;
    const changed = !previousItems || previousItems.length !== items.length || items.some((item, index) => {
      const previousItem = previousItems[index];
      return item.index !== previousItem.index || item.element !== previousItem.element || item.registration.index !== previousItem.registration.index || item.registration.metadata !== previousItem.registration.metadata;
    });
    observe(automaticNodes);
    itemsRef.current = items;
    isDirtyRef.current = false;
    if (!changed) {
      return;
    }
    listeners.forEach(listener => listener(nextMap));
    onMapChange(nextMap);
  });
  useIsoLayoutEffect(() => {
    // Re-copy the last committed snapshot when the ref objects change or Strict Mode replays
    // effects without reattaching callback refs.
    if (!isDirtyRef.current && itemsRef.current) {
      syncRefs(itemsRef.current);
    }
    return () => {
      elementsRef.current = [];
      if (labelsRef) {
        labelsRef.current = [];
      }
    };
  }, [elementsRef, labelsRef, syncRefs]);
  useIsoLayoutEffect(() => {
    if (isDirtyRef.current) {
      flush();
    }
  });
  useIsoLayoutEffect(() => {
    return () => {
      mutationObserverRef.current?.disconnect();
      // React 18 Strict Mode replays effects without replaying callback refs.
      // Mark the retained map dirty so the replay rebuilds refs and observation.
      isDirtyRef.current = true;
    };
  }, []);
  const subscribeMapChange = useStableCallback(fn => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  });
  const contextValue = React.useMemo(() => ({
    register,
    unregister,
    subscribeMapChange,
    nextIndexRef
  }), [register, unregister, subscribeMapChange, nextIndexRef]);
  return /*#__PURE__*/_jsx(CompositeListContext.Provider, {
    value: contextValue,
    children: children
  });
}
function createMap() {
  return new Map();
}
function createListeners() {
  return new Set();
}
function getCompositeListSnapshot(map) {
  const reservedIndices = new Set();
  const items = [];
  const automaticItems = [];
  map.forEach((registration, node) => {
    if (!node.isConnected) {
      return;
    }
    const index = registration.index;
    const item = {
      index: index ?? -1,
      element: node,
      registration
    };
    if (index === null) {
      automaticItems.push(item);
    } else if (index >= 0) {
      reservedIndices.add(index);
      items.push(item);
    }
  });
  let nextAutomaticIndex = 0;
  automaticItems.sort((a, b) => sortByDocumentPosition(a.element, b.element));
  automaticItems.forEach(item => {
    while (reservedIndices.has(nextAutomaticIndex)) {
      nextAutomaticIndex += 1;
    }
    item.index = nextAutomaticIndex;
    items.push(item);
    nextAutomaticIndex += 1;
  });
  if (reservedIndices.size > 0) {
    items.sort((a, b) => a.index - b.index);
  }
  return [items, automaticItems.map(item => item.element)];
}
function getCommonAncestor(firstNode, lastNode) {
  let ancestor = firstNode.parentElement;

  // The `parentElement` walk cannot cross shadow boundaries, so the native
  // `contains` is sufficient here.
  while (ancestor && !ancestor.contains(lastNode)) {
    ancestor = ancestor.parentElement;
  }
  return ancestor;
}
function hasMovedNode(entries) {
  for (const entry of entries) {
    for (let i = 0; i < entry.removedNodes.length; i += 1) {
      if (entry.removedNodes[i].isConnected) {
        return true;
      }
    }
  }
  return false;
}
function sortByDocumentPosition(a, b) {
  // `DOCUMENT_POSITION_CONTAINED_BY` is always reported alongside `FOLLOWING`, and `CONTAINS`
  // alongside `PRECEDING`, so testing `FOLLOWING` alone orders siblings and nested items alike.
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}