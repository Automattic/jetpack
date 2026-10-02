"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SHIFT = exports.PAGE_UP = exports.PAGE_DOWN = exports.MODIFIER_KEYS = exports.HOME = exports.END = exports.COMPOSITE_KEYS = exports.ARROW_UP = exports.ARROW_RIGHT = exports.ARROW_LEFT = exports.ARROW_DOWN = void 0;
Object.defineProperty(exports, "findNonDisabledListIndex", {
  enumerable: true,
  get: function () {
    return _utils.findNonDisabledListIndex;
  }
});
Object.defineProperty(exports, "getMaxListIndex", {
  enumerable: true,
  get: function () {
    return _utils.getMaxListIndex;
  }
});
Object.defineProperty(exports, "getMinListIndex", {
  enumerable: true,
  get: function () {
    return _utils.getMinListIndex;
  }
});
Object.defineProperty(exports, "isIndexOutOfListBounds", {
  enumerable: true,
  get: function () {
    return _utils.isIndexOutOfListBounds;
  }
});
Object.defineProperty(exports, "isListIndexDisabled", {
  enumerable: true,
  get: function () {
    return _utils.isListIndexDisabled;
  }
});
exports.isNativeInput = isNativeInput;
exports.scrollIntoViewIfNeeded = scrollIntoViewIfNeeded;
Object.defineProperty(exports, "stopEvent", {
  enumerable: true,
  get: function () {
    return _utils.stopEvent;
  }
});
var _dom = require("@floating-ui/utils/dom");
var _utils = require("../../floating-ui-react/utils");
const ARROW_UP = exports.ARROW_UP = 'ArrowUp';
const ARROW_DOWN = exports.ARROW_DOWN = 'ArrowDown';
const ARROW_LEFT = exports.ARROW_LEFT = 'ArrowLeft';
const ARROW_RIGHT = exports.ARROW_RIGHT = 'ArrowRight';
const HOME = exports.HOME = 'Home';
const END = exports.END = 'End';
const PAGE_UP = exports.PAGE_UP = 'PageUp';
const PAGE_DOWN = exports.PAGE_DOWN = 'PageDown';
const COMPOSITE_KEYS = exports.COMPOSITE_KEYS = new Set([ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, HOME, END]);
const SHIFT = exports.SHIFT = 'Shift';
const MODIFIER_KEYS = exports.MODIFIER_KEYS = [SHIFT, 'Control', 'Alt', 'Meta'];
function isInputElement(element) {
  return (0, _dom.isHTMLElement)(element) && element.tagName === 'INPUT';
}
function isNativeInput(element) {
  if (isInputElement(element) && element.selectionStart != null) {
    return true;
  }
  if ((0, _dom.isHTMLElement)(element) && element.tagName === 'TEXTAREA') {
    return true;
  }
  return false;
}
function scrollIntoViewIfNeeded(scrollContainer, element, direction, orientation) {
  if (!scrollContainer || !element || !element.scrollTo) {
    return;
  }
  let targetX = scrollContainer.scrollLeft;
  let targetY = scrollContainer.scrollTop;
  const isOverflowingX = scrollContainer.clientWidth < scrollContainer.scrollWidth;
  const isOverflowingY = scrollContainer.clientHeight < scrollContainer.scrollHeight;
  if (isOverflowingX && orientation !== 'vertical') {
    const elementOffsetLeft = getOffset(scrollContainer, element, 'left');
    const containerStyles = getStyles(scrollContainer);
    const elementStyles = getStyles(element);
    if (direction === 'ltr') {
      if (elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight > scrollContainer.scrollLeft + scrollContainer.clientWidth - containerStyles.scrollPaddingRight) {
        // overflow to the right, scroll to align right edges
        targetX = elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight - scrollContainer.clientWidth + containerStyles.scrollPaddingRight;
      } else if (elementOffsetLeft - elementStyles.scrollMarginLeft < scrollContainer.scrollLeft + containerStyles.scrollPaddingLeft) {
        // overflow to the left, scroll to align left edges
        targetX = elementOffsetLeft - elementStyles.scrollMarginLeft - containerStyles.scrollPaddingLeft;
      }
    }
    if (direction === 'rtl') {
      if (elementOffsetLeft - elementStyles.scrollMarginLeft < scrollContainer.scrollLeft + containerStyles.scrollPaddingLeft) {
        // overflow to the left, scroll to align left edges
        targetX = elementOffsetLeft - elementStyles.scrollMarginLeft - containerStyles.scrollPaddingLeft;
      } else if (elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight > scrollContainer.scrollLeft + scrollContainer.clientWidth - containerStyles.scrollPaddingRight) {
        // overflow to the right, scroll to align right edges
        targetX = elementOffsetLeft + element.offsetWidth + elementStyles.scrollMarginRight - scrollContainer.clientWidth + containerStyles.scrollPaddingRight;
      }
    }
  }
  if (isOverflowingY && orientation !== 'horizontal') {
    const elementOffsetTop = getOffset(scrollContainer, element, 'top');
    const containerStyles = getStyles(scrollContainer);
    const elementStyles = getStyles(element);
    if (elementOffsetTop - elementStyles.scrollMarginTop < scrollContainer.scrollTop + containerStyles.scrollPaddingTop) {
      // overflow upwards, align top edges
      targetY = elementOffsetTop - elementStyles.scrollMarginTop - containerStyles.scrollPaddingTop;
    } else if (elementOffsetTop + element.offsetHeight + elementStyles.scrollMarginBottom > scrollContainer.scrollTop + scrollContainer.clientHeight - containerStyles.scrollPaddingBottom) {
      // overflow downwards, align bottom edges
      targetY = elementOffsetTop + element.offsetHeight + elementStyles.scrollMarginBottom - scrollContainer.clientHeight + containerStyles.scrollPaddingBottom;
    }
  }
  scrollContainer.scrollTo({
    left: targetX,
    top: targetY,
    behavior: 'auto'
  });
}
function getOffset(ancestor, element, side) {
  const propName = side === 'left' ? 'offsetLeft' : 'offsetTop';
  let result = 0;
  while (element.offsetParent) {
    result += element[propName];
    if (element.offsetParent === ancestor) {
      break;
    }
    element = element.offsetParent;
  }
  return result;
}
function getStyles(element) {
  const styles = getComputedStyle(element);
  return {
    scrollMarginTop: parseFloat(styles.scrollMarginTop) || 0,
    scrollMarginRight: parseFloat(styles.scrollMarginRight) || 0,
    scrollMarginBottom: parseFloat(styles.scrollMarginBottom) || 0,
    scrollMarginLeft: parseFloat(styles.scrollMarginLeft) || 0,
    scrollPaddingTop: parseFloat(styles.scrollPaddingTop) || 0,
    scrollPaddingRight: parseFloat(styles.scrollPaddingRight) || 0,
    scrollPaddingBottom: parseFloat(styles.scrollPaddingBottom) || 0,
    scrollPaddingLeft: parseFloat(styles.scrollPaddingLeft) || 0
  };
}