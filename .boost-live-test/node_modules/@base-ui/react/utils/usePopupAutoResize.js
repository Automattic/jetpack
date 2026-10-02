"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.usePopupAutoResize = usePopupAutoResize;
var React = _interopRequireWildcard(require("react"));
var _useAnimationFrame = require("@base-ui/utils/useAnimationFrame");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _empty = require("@base-ui/utils/empty");
var _useAnimationsFinished = require("../internals/useAnimationsFinished");
var _getCssDimensions = require("./getCssDimensions");
var CommonPopupCssVars = _interopRequireWildcard(require("./CommonPopupCssVars"));
var CommonPositionerCssVars = _interopRequireWildcard(require("./CommonPositionerCssVars"));
/**
 * Allows the element to automatically resize based on its content while supporting animations.
 */
function usePopupAutoResize(parameters) {
  const {
    popupElement,
    positionerElement,
    content,
    mounted,
    onMeasureLayout: onMeasureLayoutParam,
    onMeasureLayoutComplete: onMeasureLayoutCompleteParam,
    side,
    direction
  } = parameters;
  const runOnceAnimationsFinish = (0, _useAnimationsFinished.useAnimationsFinished)(popupElement, true);
  const animationFrame = (0, _useAnimationFrame.useAnimationFrame)();
  const committedDimensionsRef = React.useRef(null);
  const isInitialRenderRef = React.useRef(true);
  const restoreAnchoringStylesRef = React.useRef(_empty.NOOP);
  const onMeasureLayout = (0, _useStableCallback.useStableCallback)(onMeasureLayoutParam);
  const onMeasureLayoutComplete = (0, _useStableCallback.useStableCallback)(onMeasureLayoutCompleteParam);
  const anchoringStyles = React.useMemo(() => getPopupAnchoringStyles(side, direction), [side, direction]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    // Reset the state when the popup is closed.
    if (!mounted) {
      restoreAnchoringStylesRef.current = _empty.NOOP;
      isInitialRenderRef.current = true;
      committedDimensionsRef.current = null;
      return undefined;
    }
    if (!popupElement || !positionerElement) {
      return undefined;
    }
    restoreAnchoringStylesRef.current = applyElementStyles(popupElement, anchoringStyles);

    // Measure the rendered size to enable transitions:
    setPopupCssSize(popupElement, 'auto');
    const restorePopupPosition = overrideElementStyle(popupElement, 'position', 'static');
    const restorePopupTransform = overrideElementStyle(popupElement, 'transform', 'none');
    const restorePopupScale = overrideElementStyle(popupElement, 'scale', '1');
    const restorePositionerAvailableSize = applyElementStyles(positionerElement, {
      [CommonPositionerCssVars.availableWidth]: 'max-content',
      [CommonPositionerCssVars.availableHeight]: 'max-content'
    });
    function restoreMeasurementOverrides() {
      restorePopupPosition();
      restorePopupTransform();
      restorePositionerAvailableSize();
    }
    function restoreMeasurementOverridesIncludingScale() {
      restoreMeasurementOverrides();
      restorePopupScale();
    }
    onMeasureLayout?.();

    // Initial render (for each time the popup opens).
    if (isInitialRenderRef.current || committedDimensionsRef.current === null) {
      setPositionerCssSize(positionerElement, 'max-content');
      const dimensions = (0, _getCssDimensions.getCssDimensions)(popupElement);
      committedDimensionsRef.current = dimensions;
      setPositionerCssSize(positionerElement, dimensions);
      restoreMeasurementOverridesIncludingScale();
      onMeasureLayoutComplete?.(null, dimensions);
      isInitialRenderRef.current = false;
      return () => {
        restoreAnchoringStylesRef.current();
        restoreAnchoringStylesRef.current = _empty.NOOP;
      };
    }

    // Subsequent renders while open (when `content` changes).
    setPositionerCssSize(positionerElement, 'max-content');
    const previousDimensions = committedDimensionsRef.current;
    const newDimensions = (0, _getCssDimensions.getCssDimensions)(popupElement);

    // Commit immediately so future content changes have a stable previous size.
    committedDimensionsRef.current = newDimensions;
    setPopupCssSize(popupElement, previousDimensions);
    restoreMeasurementOverridesIncludingScale();
    onMeasureLayoutComplete?.(previousDimensions, newDimensions);
    setPositionerCssSize(positionerElement, newDimensions);
    const abortController = new AbortController();
    animationFrame.request(() => {
      setPopupCssSize(popupElement, newDimensions);
      runOnceAnimationsFinish(() => {
        popupElement.style.setProperty(CommonPopupCssVars.popupWidth, 'auto');
        popupElement.style.setProperty(CommonPopupCssVars.popupHeight, 'auto');
      }, abortController.signal);
    });
    return () => {
      abortController.abort();
      animationFrame.cancel();
      restoreAnchoringStylesRef.current();
      restoreAnchoringStylesRef.current = _empty.NOOP;
    };
  }, [content, popupElement, positionerElement, runOnceAnimationsFinish, animationFrame, mounted, onMeasureLayout, onMeasureLayoutComplete, anchoringStyles]);
}
function getPopupAnchoringStyles(side, direction) {
  // Ensure popup size transitions correctly when anchored to `bottom` (side=top) or `right` (side=left).
  const isPhysicalTop = side === 'top';
  const isPhysicalLeft = side === 'left' || side === (direction === 'rtl' ? 'inline-end' : 'inline-start');
  if (!isPhysicalTop && !isPhysicalLeft) {
    return _empty.EMPTY_OBJECT;
  }
  return {
    position: 'absolute',
    [isPhysicalTop ? 'bottom' : 'top']: '0',
    [isPhysicalLeft ? 'right' : 'left']: '0'
  };
}
function overrideElementStyle(element, property, value) {
  const originalValue = element.style.getPropertyValue(property);
  element.style.setProperty(property, value);
  return () => {
    element.style.setProperty(property, originalValue);
  };
}
function applyElementStyles(element, styles) {
  const restorers = [];
  for (const [key, value] of Object.entries(styles)) {
    restorers.push(overrideElementStyle(element, key, value));
  }
  return restorers.length ? () => {
    restorers.forEach(restore => restore());
  } : _empty.NOOP;
}
function setPopupCssSize(popupElement, size) {
  const width = size === 'auto' ? 'auto' : `${size.width}px`;
  const height = size === 'auto' ? 'auto' : `${size.height}px`;
  popupElement.style.setProperty(CommonPopupCssVars.popupWidth, width);
  popupElement.style.setProperty(CommonPopupCssVars.popupHeight, height);
}
function setPositionerCssSize(positionerElement, size) {
  const width = size === 'max-content' ? 'max-content' : `${size.width}px`;
  const height = size === 'max-content' ? 'max-content' : `${size.height}px`;
  positionerElement.style.setProperty(CommonPositionerCssVars.positionerWidth, width);
  positionerElement.style.setProperty(CommonPositionerCssVars.positionerHeight, height);
}