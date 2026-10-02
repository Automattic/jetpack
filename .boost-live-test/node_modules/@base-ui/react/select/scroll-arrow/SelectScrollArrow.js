"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SelectScrollArrow = void 0;
var React = _interopRequireWildcard(require("react"));
var _useTimeout = require("@base-ui/utils/useTimeout");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _SelectRootContext = require("../root/SelectRootContext");
var _SelectPositionerContext = require("../positioner/SelectPositionerContext");
var _useTransitionStatus = require("../../internals/useTransitionStatus");
var _useOpenChangeComplete = require("../../internals/useOpenChangeComplete");
var _useRenderElement = require("../../internals/useRenderElement");
var _stateAttributesMapping = require("../../internals/stateAttributesMapping");
var _scrollEdges = require("../../utils/scrollEdges");
/**
 * @internal
 */
const SelectScrollArrow = exports.SelectScrollArrow = /*#__PURE__*/React.forwardRef(function SelectScrollArrow(componentProps, forwardedRef) {
  const {
    render,
    className,
    style,
    direction,
    keepMounted,
    ...elementProps
  } = componentProps;
  const isUp = direction === 'up';
  const store = (0, _SelectRootContext.useSelectRootContext)();
  const {
    side,
    scrollDownArrowRef,
    scrollUpArrowRef
  } = (0, _SelectPositionerContext.useSelectPositionerContext)();
  const visibleSelector = isUp ? 'scrollUpArrowVisible' : 'scrollDownArrowVisible';
  const stateVisible = store.useState(visibleSelector);
  const openMethod = store.useState('openMethod');

  // Scroll arrows are disabled for touch modality as they are a hover-only element.
  const visible = stateVisible && openMethod !== 'touch';
  const timeout = (0, _useTimeout.useTimeout)();
  const scrollArrowRef = isUp ? scrollUpArrowRef : scrollDownArrowRef;
  const {
    mounted,
    transitionStatus,
    setMounted
  } = (0, _useTransitionStatus.useTransitionStatus)(visible);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    store.context.scrollArrowsMountedCountRef.current += 1;
    store.set('hasScrollArrows', true);
    return () => {
      store.context.scrollArrowsMountedCountRef.current = Math.max(0, store.context.scrollArrowsMountedCountRef.current - 1);
      if (store.context.scrollArrowsMountedCountRef.current === 0) {
        store.set('hasScrollArrows', false);
      }
    };
  }, [store]);
  (0, _useOpenChangeComplete.useOpenChangeComplete)({
    open: visible,
    ref: scrollArrowRef,
    onComplete() {
      if (!visible) {
        setMounted(false);
      }
    }
  });
  const state = {
    direction,
    visible,
    side,
    transitionStatus
  };
  const defaultProps = {
    'aria-hidden': true,
    children: isUp ? '▲' : '▼',
    style: {
      position: 'absolute'
    },
    onMouseMove(event) {
      if (event.movementX === 0 && event.movementY === 0 || timeout.isStarted()) {
        return;
      }
      store.set('activeIndex', null);
      function scrollNextItem() {
        const scroller = store.state.listElement ?? store.context.popupRef.current;
        if (!scroller) {
          return;
        }
        store.set('activeIndex', null);
        store.context.handleScrollArrowVisibility(scroller);
        const maxScrollTop = (0, _scrollEdges.getMaxScrollOffset)(scroller.scrollHeight, scroller.clientHeight);
        const scrollTop = (0, _scrollEdges.normalizeScrollOffset)(scroller.scrollTop, maxScrollTop);
        const isScrolledToEdge = scrollTop === (isUp ? 0 : maxScrollTop);
        const items = store.context.listRef.current;
        if (scrollTop !== scroller.scrollTop) {
          scroller.scrollTop = scrollTop;
        }
        if (isScrolledToEdge) {
          timeout.clear();
          return;
        }
        if (items.length > 0) {
          const scrollArrowHeight = scrollArrowRef.current?.offsetHeight || 0;
          scroller.scrollTop = getTargetScrollTop(items, isUp, scrollTop, scroller.clientHeight, scrollArrowHeight, maxScrollTop);
        }
        timeout.start(40, scrollNextItem);
      }
      timeout.start(40, scrollNextItem);
    },
    onMouseLeave() {
      timeout.clear();
    }
  };
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    ref: [forwardedRef, scrollArrowRef],
    state,
    props: [defaultProps, elementProps],
    stateAttributesMapping: _stateAttributesMapping.transitionStatusMapping
  });
  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }
  return element;
});
if (process.env.NODE_ENV !== "production") SelectScrollArrow.displayName = "SelectScrollArrow";
function getTargetScrollTop(items, isUp, scrollTop, clientHeight, scrollArrowHeight, maxScrollTop) {
  if (isUp) {
    let firstVisibleIndex = 0;
    const visibleTop = scrollTop + scrollArrowHeight - _scrollEdges.SCROLL_EDGE_TOLERANCE_PX;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item && item.offsetTop >= visibleTop) {
        firstVisibleIndex = i;
        break;
      }
    }
    const targetIndex = Math.max(0, firstVisibleIndex - 1);
    const targetItem = items[targetIndex];
    return targetIndex < firstVisibleIndex && targetItem ? (0, _scrollEdges.normalizeScrollOffset)(targetItem.offsetTop - scrollArrowHeight, maxScrollTop) : 0;
  }
  let lastVisibleIndex = items.length - 1;
  const visibleBottom = scrollTop + clientHeight - scrollArrowHeight + _scrollEdges.SCROLL_EDGE_TOLERANCE_PX;
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (item && item.offsetTop + item.offsetHeight > visibleBottom) {
      lastVisibleIndex = Math.max(0, i - 1);
      break;
    }
  }
  const targetIndex = Math.min(items.length - 1, lastVisibleIndex + 1);
  const targetItem = items[targetIndex];
  return targetIndex > lastVisibleIndex && targetItem ? (0, _scrollEdges.normalizeScrollOffset)(targetItem.offsetTop + targetItem.offsetHeight - clientHeight + scrollArrowHeight, maxScrollTop) : maxScrollTop;
}