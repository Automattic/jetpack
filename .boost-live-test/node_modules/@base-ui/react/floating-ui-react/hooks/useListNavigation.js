"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ESCAPE = void 0;
exports.useListNavigation = useListNavigation;
var React = _interopRequireWildcard(require("react"));
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _owner = require("@base-ui/utils/owner");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useValueAsRef = require("@base-ui/utils/useValueAsRef");
var _platform = require("@base-ui/utils/platform");
var _dom = require("@floating-ui/utils/dom");
var _createBaseUIEventDetails = require("../../internals/createBaseUIEventDetails");
var _reasons = require("../../internals/reasons");
var _FloatingTree = require("../components/FloatingTree");
var _composite = require("../utils/composite");
var _constants = require("../utils/constants");
var _element = require("../utils/element");
var _enqueueFocus = require("../utils/enqueueFocus");
var _event = require("../utils/event");
const ESCAPE = exports.ESCAPE = 'Escape';

// WebKit fires zero-delta `mousemove`/`pointermove` events when the list scrolls
// beneath a stationary pointer, moving the highlight during keyboard navigation.
// https://github.com/mui/base-ui/issues/4002
function isStationaryWebKitPointer(event) {
  return _platform.platform.engine.webkit && event.movementX === 0 && event.movementY === 0;
}
function doSwitch(orientation, vertical, horizontal) {
  switch (orientation) {
    case 'vertical':
      return vertical;
    case 'horizontal':
      return horizontal;
    default:
      return vertical || horizontal;
  }
}
function isMainOrientationKey(key, orientation) {
  const vertical = key === _constants.ARROW_UP || key === _constants.ARROW_DOWN;
  const horizontal = key === _constants.ARROW_LEFT || key === _constants.ARROW_RIGHT;
  return doSwitch(orientation, vertical, horizontal);
}
function isMainOrientationToEndKey(key, orientation, rtl) {
  const vertical = key === _constants.ARROW_DOWN;
  const horizontal = rtl ? key === _constants.ARROW_LEFT : key === _constants.ARROW_RIGHT;
  return doSwitch(orientation, vertical, horizontal) || key === 'Enter' || key === ' ' || key === '';
}
function isCrossOrientationOpenKey(key, orientation, rtl) {
  const vertical = rtl ? key === _constants.ARROW_LEFT : key === _constants.ARROW_RIGHT;
  const horizontal = key === _constants.ARROW_DOWN;
  return doSwitch(orientation, vertical, horizontal);
}
function isCrossOrientationCloseKey(key, orientation, rtl, grid) {
  const vertical = rtl ? key === _constants.ARROW_RIGHT : key === _constants.ARROW_LEFT;
  const horizontal = key === _constants.ARROW_UP;
  if (orientation === 'both' || orientation === 'horizontal' && grid) {
    return key === ESCAPE;
  }
  return doSwitch(orientation, vertical, horizontal);
}
/**
 * Adds arrow key-based navigation of a list of items, either using real DOM
 * focus or virtual focus.
 * @see https://floating-ui.com/docs/useListNavigation
 */
function useListNavigation(context, props) {
  const {
    listRef,
    activeIndex,
    onNavigate: onNavigateProp = () => {},
    enabled = true,
    selectedIndex = null,
    allowEscape = false,
    loopFocus = false,
    nested = false,
    rtl = false,
    virtual = false,
    focusItemOnOpen = 'auto',
    focusItemOnHover = true,
    openOnArrowKeyDown = true,
    disabledIndices = undefined,
    orientation = 'vertical',
    parentOrientation,
    id,
    resetOnPointerLeave = true,
    externalTree,
    grid: navigateGrid
  } = props;
  const isGrid = navigateGrid != null;
  if (process.env.NODE_ENV !== 'production') {
    if (allowEscape) {
      if (!loopFocus) {
        console.warn('`useListNavigation` looping must be enabled to allow escaping.');
      }
      if (!virtual) {
        console.warn('`useListNavigation` must be virtual to allow escaping.');
      }
    }
    if (orientation === 'vertical' && isGrid) {
      console.warn('In grid list navigation mode, the `orientation` should', 'be either "horizontal" or "both".');
    }
  }
  const store = 'rootStore' in context ? context.rootStore : context;
  const open = store.useState('open');
  const floatingElement = store.useState('floatingElement');
  const domReferenceElement = store.useState('domReferenceElement');
  const dataRef = store.context.dataRef;
  const floatingFocusElement = (0, _element.getFloatingFocusElement)(floatingElement);
  const typeableComboboxReference = (0, _element.isTypeableCombobox)(domReferenceElement);
  const floatingFocusElementRef = (0, _useValueAsRef.useValueAsRef)(floatingFocusElement);
  const parentId = (0, _FloatingTree.useFloatingParentNodeId)();
  const tree = (0, _FloatingTree.useFloatingTree)(externalTree);
  const focusItemOnOpenRef = React.useRef(focusItemOnOpen);
  const indexRef = React.useRef(selectedIndex ?? -1);
  const keyRef = React.useRef(null);
  const isPointerModalityRef = React.useRef(true);
  const onNavigate = (0, _useStableCallback.useStableCallback)(event => {
    onNavigateProp(indexRef.current === -1 ? null : indexRef.current, event);
  });
  const previousMountedRef = React.useRef(!!floatingElement);
  const previousOpenRef = React.useRef(open);
  const forceSyncFocusRef = React.useRef(false);
  const forceScrollIntoViewRef = React.useRef(false);
  const cancelQueuedFocusRef = React.useRef(null);
  const disabledIndicesRef = (0, _useValueAsRef.useValueAsRef)(disabledIndices);
  const latestOpenRef = (0, _useValueAsRef.useValueAsRef)(open);
  const selectedIndexRef = (0, _useValueAsRef.useValueAsRef)(selectedIndex);
  const resetOnPointerLeaveRef = (0, _useValueAsRef.useValueAsRef)(resetOnPointerLeave);
  const focusFrame = (0, _useAnimationFrame.useAnimationFrame)();
  const waitForListPopulatedFrame = (0, _useAnimationFrame.useAnimationFrame)();
  const focusItem = (0, _useStableCallback.useStableCallback)(() => {
    function runFocus(item) {
      if (virtual) {
        tree?.events.emit('virtualfocus', item);
      } else {
        cancelQueuedFocusRef.current = (0, _enqueueFocus.enqueueFocus)(item, {
          sync: forceSyncFocusRef.current,
          preventScroll: true
        });
      }
    }
    const initialItem = listRef.current[indexRef.current];
    const forceScrollIntoView = forceScrollIntoViewRef.current;
    if (initialItem) {
      runFocus(initialItem);
    }
    const scheduler = forceSyncFocusRef.current ? callback => callback() : callback => focusFrame.request(callback);
    scheduler(() => {
      const waitedItem = listRef.current[indexRef.current] || initialItem;
      if (!waitedItem) {
        return;
      }
      if (!initialItem) {
        runFocus(waitedItem);
      }
      const shouldScrollIntoView =
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      item && (forceScrollIntoView || !isPointerModalityRef.current);
      if (shouldScrollIntoView) {
        // JSDOM doesn't support `.scrollIntoView()` but it's widely supported
        // by all browsers.
        waitedItem.scrollIntoView?.({
          block: 'nearest',
          inline: 'nearest'
        });
      }
    });
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    dataRef.current.orientation = orientation;
  }, [dataRef, orientation]);

  // Sync `selectedIndex` to be the `activeIndex` upon opening the floating
  // element. Also, reset `activeIndex` upon closing the floating element.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!enabled) {
      return;
    }
    if (open && floatingElement) {
      indexRef.current = selectedIndex ?? -1;
      if (focusItemOnOpenRef.current && selectedIndex != null) {
        // Regardless of the pointer modality, we want to ensure the selected
        // item comes into view when the floating element is opened.
        forceScrollIntoViewRef.current = true;
        onNavigate();
      }
    } else if (previousMountedRef.current) {
      // Reset the active index when the list is no longer open and mounted (closing or
      // unmounting). `onNavigate` is a stable callback that always forwards to the latest
      // `onNavigate` prop.
      indexRef.current = -1;
      onNavigate();
    }
  }, [enabled, open, floatingElement, selectedIndex, onNavigate]);

  // Sync `activeIndex` to be the focused item while the floating element is
  // open.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!enabled) {
      return;
    }
    if (!open) {
      forceSyncFocusRef.current = false;
      return;
    }
    if (!floatingElement) {
      return;
    }
    if (activeIndex == null) {
      forceSyncFocusRef.current = false;
      if (selectedIndexRef.current != null) {
        return;
      }

      // Reset while the floating element was open (e.g. the list changed).
      if (previousMountedRef.current) {
        indexRef.current = -1;
        focusItem();
      }

      // Initial sync.
      if ((!previousOpenRef.current || !previousMountedRef.current) && focusItemOnOpenRef.current && (keyRef.current != null || focusItemOnOpenRef.current === true && keyRef.current == null)) {
        let runs = 0;
        const waitForListPopulated = () => {
          if (listRef.current[0] == null) {
            // Avoid letting the browser paint if possible on the first try,
            // otherwise use rAF. Don't try more than twice, since something
            // is wrong otherwise.
            if (runs < 2) {
              const scheduler = runs ? callback => waitForListPopulatedFrame.request(callback) : queueMicrotask;
              scheduler(waitForListPopulated);
            }
            runs += 1;
          } else {
            // Initially focus the first non-disabled item. `disabledIndices` is deliberately
            // omitted here so attribute-disabled items (`disabled`/`aria-disabled`) are skipped
            // on open even when the consumer passes an empty `disabledIndices` array. Passing it
            // would regress that behavior (see mui/base-ui#2604).
            indexRef.current = keyRef.current == null || isMainOrientationToEndKey(keyRef.current, orientation, rtl) || nested ? (0, _composite.getMinListIndex)(listRef) : (0, _composite.getMaxListIndex)(listRef);
            keyRef.current = null;
            onNavigate();
          }
        };
        waitForListPopulated();
      }
    } else if (!(0, _composite.isIndexOutOfListBounds)(listRef.current, activeIndex)) {
      indexRef.current = activeIndex;
      focusItem();
      forceScrollIntoViewRef.current = false;
    }
  }, [enabled, open, floatingElement, activeIndex, selectedIndexRef, nested, listRef, orientation, rtl, onNavigate, focusItem, waitForListPopulatedFrame]);

  // Ensure the parent floating element has focus when a nested child closes
  // to allow arrow key navigation to work after the pointer leaves the child.
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!enabled || floatingElement || !tree || virtual || !previousMountedRef.current) {
      return;
    }
    const nodes = tree.nodesRef.current;
    const parent = nodes.find(node => node.id === parentId)?.context?.elements.floating;
    // `floatingElement` is null here (see the guard above), so resolve the owner document from an
    // in-DOM element for realm-safety (shadow DOM/iframes): the reference element, falling back to
    // the parent floating element when the reference is virtual (`domReferenceElement` is null).
    const activeEl = (0, _element.activeElement)((0, _owner.ownerDocument)(domReferenceElement ?? parent ?? null));
    const treeContainsActiveEl = nodes.some(node => node.context && (0, _element.contains)(node.context.elements.floating, activeEl));
    if (parent && !treeContainsActiveEl && isPointerModalityRef.current) {
      parent.focus({
        preventScroll: true
      });
    }
  }, [enabled, floatingElement, domReferenceElement, tree, parentId, virtual]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    previousOpenRef.current = open;
    previousMountedRef.current = !!floatingElement;
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!open) {
      keyRef.current = null;
      focusItemOnOpenRef.current = focusItemOnOpen;
    }
  }, [open, focusItemOnOpen]);
  const hasActiveIndex = activeIndex != null;
  const syncCurrentTarget = (0, _useStableCallback.useStableCallback)(event => {
    if (!latestOpenRef.current) {
      return;
    }
    const index = listRef.current.indexOf(event.currentTarget);
    if (index !== -1 && (indexRef.current !== index || activeIndex !== index)) {
      indexRef.current = index;
      onNavigate(event);
    }
  });
  const getParentOrientation = (0, _useStableCallback.useStableCallback)(() => {
    return parentOrientation ?? tree?.nodesRef.current.find(node => node.id === parentId)?.context?.dataRef?.current.orientation;
  });
  const getMinEnabledIndex = (0, _useStableCallback.useStableCallback)(() => {
    return (0, _composite.getMinListIndex)(listRef, disabledIndicesRef.current);
  });
  const commonOnKeyDown = (0, _useStableCallback.useStableCallback)(event => {
    isPointerModalityRef.current = false;
    forceSyncFocusRef.current = true;

    // When composing a character, Chrome fires ArrowDown twice. Firefox/Safari
    // don't appear to suffer from this. `event.isComposing` is avoided due to
    // Safari not supporting it properly (although it's not needed in the first
    // place for Safari, just avoiding any possible issues).
    if (event.which === 229) {
      return;
    }

    // If the floating element is animating out, ignore navigation. Otherwise,
    // the `activeIndex` gets set to 0 despite not being open so the next time
    // the user ArrowDowns, the first item won't be focused.
    if (!latestOpenRef.current && event.currentTarget === floatingFocusElementRef.current) {
      return;
    }
    if (nested && isCrossOrientationCloseKey(event.key, orientation, rtl, isGrid)) {
      // If the nested list's close key is also the parent navigation key,
      // let the parent navigate. Otherwise, stop propagating the event.
      if (!isMainOrientationKey(event.key, getParentOrientation())) {
        (0, _event.stopEvent)(event);
      }
      store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.listNavigation, event.nativeEvent));
      if ((0, _dom.isHTMLElement)(domReferenceElement)) {
        if (virtual) {
          tree?.events.emit('virtualfocus', domReferenceElement);
        } else {
          domReferenceElement.focus();
        }
      }
      return;
    }
    const currentIndex = indexRef.current;
    const minIndex = (0, _composite.getMinListIndex)(listRef, disabledIndices);
    const maxIndex = (0, _composite.getMaxListIndex)(listRef, disabledIndices);
    if (!typeableComboboxReference) {
      if (event.key === 'Home') {
        (0, _event.stopEvent)(event);
        indexRef.current = minIndex;
        onNavigate(event);
      }
      if (event.key === 'End') {
        (0, _event.stopEvent)(event);
        indexRef.current = maxIndex;
        onNavigate(event);
      }
    }

    // Grid navigation is injected by grid-capable consumers so non-grid
    // consumers (menu, select) tree-shake the grid helpers out.
    if (navigateGrid != null) {
      const index = navigateGrid(event, indexRef.current, listRef, orientation, loopFocus, rtl, disabledIndices, minIndex, maxIndex);
      if (index != null) {
        indexRef.current = index;
        onNavigate(event);
      }
      if (orientation === 'both') {
        return;
      }
    }
    if (isMainOrientationKey(event.key, orientation)) {
      (0, _event.stopEvent)(event);

      // Reset the index if no item is focused.
      if (open && !virtual && (0, _element.activeElement)(event.currentTarget.ownerDocument) === event.currentTarget) {
        indexRef.current = isMainOrientationToEndKey(event.key, orientation, rtl) ? minIndex : maxIndex;
        onNavigate(event);
        return;
      }
      if (isMainOrientationToEndKey(event.key, orientation, rtl)) {
        if (loopFocus) {
          if (currentIndex >= maxIndex) {
            if (allowEscape && currentIndex !== listRef.current.length) {
              indexRef.current = -1;
            } else {
              // Give time for virtualizers to update the listRef.
              forceSyncFocusRef.current = false;
              indexRef.current = minIndex;
            }
          } else {
            indexRef.current = (0, _composite.findNonDisabledListIndex)(listRef.current, {
              startingIndex: currentIndex,
              disabledIndices
            });
          }
        } else {
          indexRef.current = Math.min(maxIndex, (0, _composite.findNonDisabledListIndex)(listRef.current, {
            startingIndex: currentIndex,
            disabledIndices
          }));
        }
      } else if (loopFocus) {
        if (currentIndex <= minIndex) {
          if (allowEscape && currentIndex !== -1) {
            indexRef.current = listRef.current.length;
          } else {
            // Give time for virtualizers to update the listRef.
            forceSyncFocusRef.current = false;
            indexRef.current = maxIndex;
          }
        } else {
          indexRef.current = (0, _composite.findNonDisabledListIndex)(listRef.current, {
            startingIndex: currentIndex,
            decrement: true,
            disabledIndices
          });
        }
      } else {
        indexRef.current = Math.max(minIndex, (0, _composite.findNonDisabledListIndex)(listRef.current, {
          startingIndex: currentIndex,
          decrement: true,
          disabledIndices
        }));
      }
      if ((0, _composite.isIndexOutOfListBounds)(listRef.current, indexRef.current)) {
        indexRef.current = -1;
      }
      onNavigate(event);
    }
  });
  const item = React.useMemo(() => {
    const itemProps = {
      onFocus(event) {
        forceSyncFocusRef.current = true;
        syncCurrentTarget(event);
      },
      onClick: ({
        currentTarget
      }) => currentTarget.focus({
        preventScroll: true
      }),
      // Safari
      onMouseMove(event) {
        if (isStationaryWebKitPointer(event)) {
          return;
        }
        forceSyncFocusRef.current = true;
        forceScrollIntoViewRef.current = false;
        if (focusItemOnHover) {
          syncCurrentTarget(event);
        }
      },
      onPointerLeave(event) {
        if (!latestOpenRef.current || !isPointerModalityRef.current || event.pointerType === 'touch') {
          return;
        }
        forceSyncFocusRef.current = true;
        const relatedTarget = event.relatedTarget;
        if (!focusItemOnHover || listRef.current.includes(relatedTarget)) {
          return;
        }
        if (!resetOnPointerLeaveRef.current) {
          return;
        }
        cancelQueuedFocusRef.current?.();
        cancelQueuedFocusRef.current = null;
        indexRef.current = -1;
        onNavigate(event);
        if (!virtual) {
          const floatingFocusEl = floatingFocusElementRef.current;
          const activeEl = (0, _element.activeElement)((0, _owner.ownerDocument)(floatingFocusEl));
          if (floatingFocusEl && (0, _element.contains)(floatingFocusEl, activeEl)) {
            floatingFocusEl.focus({
              preventScroll: true
            });
          }
        }
      }
    };
    return itemProps;
  }, [syncCurrentTarget, latestOpenRef, floatingFocusElementRef, focusItemOnHover, listRef, onNavigate, resetOnPointerLeaveRef, virtual]);
  const ariaActiveDescendantProp = React.useMemo(() => {
    return virtual && open && hasActiveIndex && {
      'aria-activedescendant': `${id}-${activeIndex}`
    };
  }, [virtual, open, hasActiveIndex, id, activeIndex]);
  const floating = React.useMemo(() => {
    return {
      ...(!typeableComboboxReference ? ariaActiveDescendantProp : {}),
      onKeyDown(event) {
        // Close submenu on Shift+Tab
        if (event.key === 'Tab' && event.shiftKey && open && !virtual) {
          // If the event originated from within a nested element (e.g., a Dialog opened from
          // within the menu), don't close the menu. The nested element has its own focus
          // management and should handle the Tab key.
          const target = (0, _element.getTarget)(event.nativeEvent);
          if (target && !(0, _element.contains)(floatingFocusElementRef.current, target)) {
            return;
          }
          (0, _event.stopEvent)(event);
          store.setOpen(false, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.focusOut, event.nativeEvent));
          if ((0, _dom.isHTMLElement)(domReferenceElement)) {
            domReferenceElement.focus();
          }
          return;
        }
        commonOnKeyDown(event);
      },
      onPointerMove(event) {
        if (isStationaryWebKitPointer(event)) {
          return;
        }
        isPointerModalityRef.current = true;
      }
    };
  }, [ariaActiveDescendantProp, commonOnKeyDown, floatingFocusElementRef, typeableComboboxReference, store, open, virtual, domReferenceElement]);
  const trigger = React.useMemo(() => {
    function openOnNavigationKeyDown(event) {
      store.setOpen(true, (0, _createBaseUIEventDetails.createChangeEventDetails)(_reasons.REASONS.listNavigation, event.nativeEvent, event.currentTarget));
    }
    function checkVirtualMouse(event) {
      if (focusItemOnOpen === 'auto' && (0, _event.isVirtualClick)(event.nativeEvent)) {
        focusItemOnOpenRef.current = !virtual;
      }
    }
    function checkVirtualPointer(event) {
      // `pointerdown` fires first, reset the state then perform the checks.
      focusItemOnOpenRef.current = focusItemOnOpen;
      if (focusItemOnOpen === 'auto' && (0, _event.isVirtualPointerEvent)(event.nativeEvent)) {
        focusItemOnOpenRef.current = true;
      }
    }
    return {
      onKeyDown(event) {
        // non-reactive open state (to prevent re-creation of the handler)
        const currentOpen = store.select('open');
        isPointerModalityRef.current = false;
        const isArrowKey = event.key.startsWith('Arrow');
        const isParentCrossOpenKey = isCrossOrientationOpenKey(event.key, getParentOrientation(), rtl);
        const isMainKey = isMainOrientationKey(event.key, orientation);
        const isNavigationKey = (nested ? isParentCrossOpenKey : isMainKey) || event.key === 'Enter' || event.key.trim() === '';
        if (virtual && currentOpen) {
          return commonOnKeyDown(event);
        }

        // If a floating element should not open on arrow key down, avoid
        // setting `activeIndex` while it's closed.
        if (!currentOpen && !openOnArrowKeyDown && isArrowKey) {
          return undefined;
        }
        if (isNavigationKey) {
          const isParentMainKey = isMainOrientationKey(event.key, getParentOrientation());
          keyRef.current = nested && isParentMainKey ? null : event.key;
        }
        if (nested) {
          if (isParentCrossOpenKey) {
            (0, _event.stopEvent)(event);
            if (currentOpen) {
              indexRef.current = getMinEnabledIndex();
              onNavigate(event);
            } else {
              openOnNavigationKeyDown(event);
            }
          }
          return undefined;
        }
        if (isMainKey) {
          if (selectedIndexRef.current != null) {
            indexRef.current = selectedIndexRef.current;
          }
          (0, _event.stopEvent)(event);
          if (!currentOpen && openOnArrowKeyDown) {
            openOnNavigationKeyDown(event);
          } else {
            commonOnKeyDown(event);
          }
          if (currentOpen) {
            onNavigate(event);
          }
        }
        return undefined;
      },
      onFocus(event) {
        if (store.select('open') && !virtual) {
          indexRef.current = -1;
          onNavigate(event);
        }
      },
      onPointerDown: checkVirtualPointer,
      onPointerEnter: checkVirtualPointer,
      onMouseDown: checkVirtualMouse,
      onClick: checkVirtualMouse
    };
  }, [commonOnKeyDown, focusItemOnOpen, getMinEnabledIndex, nested, onNavigate, store, openOnArrowKeyDown, orientation, getParentOrientation, rtl, selectedIndexRef, virtual]);
  const reference = React.useMemo(() => {
    return {
      ...ariaActiveDescendantProp,
      ...trigger
    };
  }, [ariaActiveDescendantProp, trigger]);
  return React.useMemo(() => enabled ? {
    reference,
    floating,
    item,
    trigger
  } : {}, [enabled, reference, floating, trigger, item]);
}