"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useCompositeRoot = useCompositeRoot;
var React = _interopRequireWildcard(require("react"));
var _isElementDisabled = require("@base-ui/utils/isElementDisabled");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _empty = require("@base-ui/utils/empty");
var _composite = require("../composite");
var _constants = require("../constants");
var _utils = require("../../../floating-ui-react/utils");
function useCompositeRoot(params) {
  const {
    loopFocus = true,
    orientation = 'both',
    grid,
    onLoop,
    direction,
    highlightedIndex: externalHighlightedIndex,
    onHighlightedIndexChange: externalSetHighlightedIndex,
    rootRef: externalRef,
    enableHomeAndEndKeys = false,
    stopEventPropagation,
    disabledIndices,
    modifierKeys = _empty.EMPTY_ARRAY
  } = params;
  const [internalHighlightedIndex, internalSetHighlightedIndex] = React.useState(0);
  const isGrid = grid != null;
  const rootRef = React.useRef(null);
  const mergedRef = (0, _useMergedRefs.useMergedRefs)(rootRef, externalRef);
  const elementsRef = React.useRef([]);
  const hasSetDefaultIndexRef = React.useRef(false);
  const highlightedElementRef = React.useRef(null);
  const highlightedIndex = externalHighlightedIndex ?? internalHighlightedIndex;
  const onHighlightedIndexChange = (0, _useStableCallback.useStableCallback)((index, shouldScrollIntoView = false) => {
    highlightedElementRef.current = elementsRef.current[index] ?? null;
    (externalSetHighlightedIndex ?? internalSetHighlightedIndex)(index);
    if (shouldScrollIntoView) {
      const newActiveItem = elementsRef.current[index];
      (0, _composite.scrollIntoViewIfNeeded)(rootRef.current, newActiveItem, direction, orientation);
    }
  });
  const onMapChange = (0, _useStableCallback.useStableCallback)(map => {
    if (map.size === 0) {
      return;
    }
    if (hasSetDefaultIndexRef.current) {
      const elements = elementsRef.current;
      // Items added or removed around the highlighted one shift its index, so the tab stop would
      // otherwise move to a different item and navigation would resume from the wrong position.
      const nextIndex = elements.indexOf(highlightedElementRef.current);
      if (nextIndex === -1) {
        // A replacement at the same index can keep the tab stop. Otherwise move it to an
        // eligible item so a missing, hidden, or disabled replacement does not take the
        // composite out of the tab order.
        const replacement = elements[highlightedIndex];
        if (!replacement || (0, _composite.isListIndexDisabled)(elements, highlightedIndex, disabledIndices)) {
          onHighlightedIndexChange(getFallbackIndex(elements, disabledIndices));
        } else {
          highlightedElementRef.current = replacement;
        }
      } else if (nextIndex !== highlightedIndex) {
        onHighlightedIndexChange(nextIndex);
      }
      return;
    }
    hasSetDefaultIndexRef.current = true;
    const sortedElements = Array.from(map.keys());
    const activeItem = sortedElements.find(compositeElement => compositeElement?.hasAttribute(_constants.ACTIVE_COMPOSITE_ITEM)) ?? null;
    // Set the default highlighted index of an arbitrary composite item. The map value carries
    // the item's own index, which is not its position among the keys once a list mixes explicit
    // and automatic indexes and leaves gaps.
    const activeIndex = activeItem ? map.get(activeItem)?.index ?? -1 : -1;
    if (activeIndex !== -1) {
      onHighlightedIndexChange(activeIndex);
    } else if ((0, _composite.isListIndexDisabled)(sortedElements, highlightedIndex, disabledIndices)) {
      // The default highlighted item is disabled, so it should not hold the single
      // roving tab stop: a natively disabled element is removed from the tab order,
      // and an aria-disabled one should not be the entry point. Move the tab stop
      // to the first enabled item. If every item is disabled, keep the current
      // highlighted index.
      const firstEnabledIndex = (0, _composite.findNonDisabledListIndex)(sortedElements, {
        disabledIndices
      });
      if (!(0, _composite.isIndexOutOfListBounds)(sortedElements, firstEnabledIndex)) {
        onHighlightedIndexChange(firstEnabledIndex);
      }
    }
    (0, _composite.scrollIntoViewIfNeeded)(rootRef.current, activeItem, direction, orientation);
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    // `disabledIndices` can resolve a render after the initial map population
    // (e.g. Toolbar derives it from item metadata through a state update), so the
    // default tab stop at index 0 may now point at a disabled item, leaving the
    // composite without a reachable tab stop. Re-validate and move it to the first
    // enabled item. Gated on `disabledIndices` being provided so composites that
    // rely on the DOM disabled fallback keep their existing behavior.
    if (disabledIndices == null || externalHighlightedIndex != null || !hasSetDefaultIndexRef.current) {
      return;
    }
    const elements = elementsRef.current;
    if ((0, _composite.isListIndexDisabled)(elements, highlightedIndex, disabledIndices)) {
      const firstEnabledIndex = (0, _composite.findNonDisabledListIndex)(elements, {
        disabledIndices
      });
      if (!(0, _composite.isIndexOutOfListBounds)(elements, firstEnabledIndex)) {
        onHighlightedIndexChange(firstEnabledIndex);
      }
    }
  }, [disabledIndices, externalHighlightedIndex, highlightedIndex, elementsRef, onHighlightedIndexChange]);
  const wrappedOnLoop = (0, _useStableCallback.useStableCallback)((event, prevIndex, nextIndex) => {
    if (!onLoop) {
      return nextIndex;
    }
    return onLoop(event, prevIndex, nextIndex, elementsRef);
  });

  // Stable so that `relayKeyboardEvent` does not invalidate identity-sensitive
  // consumers (the `CompositeRootContext` value and trigger data forwarding).
  const onKeyDown = (0, _useStableCallback.useStableCallback)(event => {
    const isHomeOrEnd = event.key === _composite.HOME || event.key === _composite.END;
    if (!_composite.COMPOSITE_KEYS.has(event.key) || !enableHomeAndEndKeys && isHomeOrEnd) {
      return;
    }
    if (isModifierKeySet(event, modifierKeys)) {
      return;
    }
    const element = rootRef.current;
    if (!element) {
      return;
    }
    const isRtl = direction === 'rtl';
    const horizontalForwardKey = isRtl ? _composite.ARROW_LEFT : _composite.ARROW_RIGHT;
    const horizontalBackwardKey = isRtl ? _composite.ARROW_RIGHT : _composite.ARROW_LEFT;
    const forwardKey = orientation === 'vertical' ? _composite.ARROW_DOWN : horizontalForwardKey;
    const backwardKey = orientation === 'vertical' ? _composite.ARROW_UP : horizontalBackwardKey;
    const target = (0, _utils.getTarget)(event.nativeEvent);
    if (target != null && (0, _composite.isNativeInput)(target) && !(0, _isElementDisabled.isElementDisabled)(target)) {
      const selectionStart = target.selectionStart;
      const selectionEnd = target.selectionEnd;
      const textContent = target.value;
      // return to native textbox behavior when
      // 1 - Shift is held to make a text selection, or if there already is a text selection
      if (selectionStart == null || event.shiftKey || selectionStart !== selectionEnd) {
        return;
      }
      // 2 - arrow-ing forward and not in the last position of the text
      if (event.key !== backwardKey && selectionStart < textContent.length) {
        return;
      }
      // 3 -arrow-ing backward and not in the first position of the text
      if (event.key !== forwardKey && selectionStart > 0) {
        return;
      }
    }
    let nextIndex = highlightedIndex;
    const minIndex = (0, _composite.getMinListIndex)(elementsRef, disabledIndices);
    const maxIndex = (0, _composite.getMaxListIndex)(elementsRef, disabledIndices);
    if (grid != null) {
      nextIndex = grid({
        disabledIndices,
        elementsRef,
        event,
        highlightedIndex,
        loopFocus,
        maxIndex,
        minIndex,
        onLoop: wrappedOnLoop,
        orientation,
        rtl: isRtl
      });
    }
    const isForwardKey = orientation !== 'vertical' && event.key === horizontalForwardKey || orientation !== 'horizontal' && event.key === _composite.ARROW_DOWN;
    const isBackwardKey = orientation !== 'vertical' && event.key === horizontalBackwardKey || orientation !== 'horizontal' && event.key === _composite.ARROW_UP;
    if (enableHomeAndEndKeys) {
      if (event.key === _composite.HOME) {
        nextIndex = minIndex;
      } else if (event.key === _composite.END) {
        nextIndex = maxIndex;
      }
    }
    if (nextIndex === highlightedIndex && (isForwardKey || isBackwardKey)) {
      if (loopFocus && nextIndex === maxIndex && isForwardKey) {
        nextIndex = minIndex;
        if (onLoop) {
          nextIndex = onLoop(event, highlightedIndex, nextIndex, elementsRef);
        }
      } else if (loopFocus && nextIndex === minIndex && isBackwardKey) {
        nextIndex = maxIndex;
        if (onLoop) {
          nextIndex = onLoop(event, highlightedIndex, nextIndex, elementsRef);
        }
      } else {
        nextIndex = (0, _composite.findNonDisabledListIndex)(elementsRef.current, {
          startingIndex: nextIndex,
          decrement: isBackwardKey,
          disabledIndices
        });
      }
    }
    if (nextIndex !== highlightedIndex && !(0, _composite.isIndexOutOfListBounds)(elementsRef.current, nextIndex)) {
      if (stopEventPropagation) {
        event.stopPropagation();
      }
      if (isGrid || isHomeOrEnd || isForwardKey || isBackwardKey) {
        event.preventDefault();
      }
      onHighlightedIndexChange(nextIndex, true);

      // Wait for FocusManager `returnFocus` to execute.
      queueMicrotask(() => {
        elementsRef.current[nextIndex]?.focus();
      });
    }
  });
  const props = {
    ref: mergedRef,
    onFocus(event) {
      const element = rootRef.current;
      const target = (0, _utils.getTarget)(event.nativeEvent);
      if (!element || target == null || !(0, _composite.isNativeInput)(target)) {
        return;
      }
      target.setSelectionRange(0, target.value.length);
    },
    onKeyDown
  };
  return {
    props,
    highlightedIndex,
    onHighlightedIndexChange,
    elementsRef,
    onMapChange,
    relayKeyboardEvent: onKeyDown
  };
}

// Resolves the item that should hold the tab stop: the active item when it can take focus,
// otherwise the first item that can. Falls back to index 0 so an all-disabled composite keeps the
// index in range and regains a tab stop as soon as one of its items becomes focusable.
function getFallbackIndex(elements, disabledIndices) {
  let fallbackIndex = -1;
  for (let index = 0; index < elements.length; index += 1) {
    const element = elements[index];
    if (!element || (0, _composite.isListIndexDisabled)(elements, index, disabledIndices)) {
      continue;
    }
    if (element.hasAttribute(_constants.ACTIVE_COMPOSITE_ITEM)) {
      return index;
    }
    if (fallbackIndex === -1) {
      fallbackIndex = index;
    }
  }
  return Math.max(fallbackIndex, 0);
}
function isModifierKeySet(event, ignoredModifierKeys) {
  for (const key of _composite.MODIFIER_KEYS) {
    if (ignoredModifierKeys.includes(key)) {
      continue;
    }
    if (event.getModifierState(key)) {
      return true;
    }
  }
  return false;
}