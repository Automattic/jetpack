"use strict";
'use client';

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SliderThumb = void 0;
var React = _interopRequireWildcard(require("react"));
var _useStableCallback = require("@base-ui/utils/useStableCallback");
var _useIsoLayoutEffect = require("@base-ui/utils/useIsoLayoutEffect");
var _useMergedRefs = require("@base-ui/utils/useMergedRefs");
var _visuallyHidden = require("@base-ui/utils/visuallyHidden");
var _owner = require("@base-ui/utils/owner");
var _thumb = require("#prehydration/slider/thumb");
var _clamp = require("@base-ui/utils/clamp");
var _formatNumber = require("@base-ui/utils/formatNumber");
var _mergeProps = require("../../merge-props");
var _useBaseUiId = require("../../internals/useBaseUiId");
var _useIsHydrating = require("../../utils/useIsHydrating");
var _useRenderElement = require("../../internals/useRenderElement");
var _valueToPercent = require("../../utils/valueToPercent");
var _composite = require("../../internals/composite/composite");
var _useCompositeListItem = require("../../internals/composite/list/useCompositeListItem");
var _DirectionContext = require("../../internals/direction-context/DirectionContext");
var _PrehydrationScript2 = require("../../internals/PrehydrationScript");
var _FieldRootContext = require("../../internals/field-root-context/FieldRootContext");
var _utils = require("../../floating-ui-react/utils");
var _element = require("../../floating-ui-react/utils/element");
var _useLabelableId = require("../../internals/labelable-provider/useLabelableId");
var _getMidpoint = require("../utils/getMidpoint");
var _getSliderValue = require("../utils/getSliderValue");
var _roundValueToStep = require("../utils/roundValueToStep");
var _SliderRootContext = require("../root/SliderRootContext");
var _stateAttributesMapping = require("../root/stateAttributesMapping");
var SliderThumbDataAttributes = _interopRequireWildcard(require("./SliderThumbDataAttributes"));
var _jsxRuntime = require("react/jsx-runtime");
var _PrehydrationScript;
const ALL_KEYS = new Set([..._composite.COMPOSITE_KEYS, _composite.PAGE_UP, _composite.PAGE_DOWN]);
function getDefaultAriaValueText(values, index, format, locale) {
  if (index < 0) {
    return undefined;
  }
  if (values.length === 2) {
    return `${(0, _formatNumber.formatNumber)(values[index], locale, format)} ${index === 0 ? 'start' : 'end'} range`;
  }
  return format ? (0, _formatNumber.formatNumber)(values[index], locale, format) : undefined;
}
function getNewValue(thumbValue, increment, direction, min, max) {
  const value = thumbValue + increment * direction;
  const roundedValue = Number(value.toFixed(Math.max((0, _roundValueToStep.getDecimalPrecision)(thumbValue), (0, _roundValueToStep.getDecimalPrecision)(increment), (0, _roundValueToStep.getDecimalPrecision)(min))));
  return (0, _clamp.clamp)(roundedValue, min, max);
}

/**
 * The draggable part of the slider at the tip of the indicator.
 * Renders a `<div>` element and a nested `<input type="range">`.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
const SliderThumb = exports.SliderThumb = /*#__PURE__*/React.forwardRef(function SliderThumb(componentProps, forwardedRef) {
  const {
    render,
    children: childrenProp,
    className,
    'aria-describedby': ariaDescribedByProp,
    'aria-label': ariaLabelProp,
    'aria-labelledby': ariaLabelledByProp,
    'aria-valuetext': ariaValueTextProp,
    disabled: disabledProp = false,
    getAriaLabel: getAriaLabelProp,
    getAriaValueText: getAriaValueTextProp,
    id: idProp,
    index: indexProp,
    inputRef: inputRefProp,
    onBlur: onBlurProp,
    onFocus: onFocusProp,
    onKeyDown: onKeyDownProp,
    tabIndex: tabIndexProp,
    style,
    ...elementProps
  } = componentProps;
  const id = (0, _useBaseUiId.useBaseUiId)(idProp);
  const {
    active: activeIndex,
    lastUsedThumbIndex,
    controlRef,
    disabled: contextDisabled,
    validation,
    format,
    handleInputChange,
    inset,
    labelId,
    largeStep,
    locale,
    max,
    min,
    minStepsBetweenValues,
    form,
    name,
    orientation,
    pressedThumbCenterOffsetRef,
    pressedThumbIndexRef,
    renderBeforeHydration,
    setActive,
    setIndicatorPosition,
    state,
    step,
    thumbRefs,
    values: sliderValues
  } = (0, _SliderRootContext.useSliderRootContext)();
  const direction = (0, _DirectionContext.useDirection)();
  const disabled = disabledProp || contextDisabled;
  const range = sliderValues.length > 1;
  const vertical = orientation === 'vertical';
  const rtl = direction === 'rtl';
  const {
    setTouched,
    setFocused,
    validationMode
  } = (0, _FieldRootContext.useFieldRootContext)();
  const thumbRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const restoringFocusVisibleRef = React.useRef(false);

  // Attached to the `input` (not the thumb wrapper) so `event.currentTarget` is the
  // input, matching `onKeyDown`. The synthetic blur/focus dispatched while restoring
  // `:focus-visible` is internal and must not be forwarded to the user's handlers.
  const handleFocusProp = (0, _useStableCallback.useStableCallback)(event => {
    if (restoringFocusVisibleRef.current) {
      return;
    }
    onFocusProp?.(event);
  });
  const handleBlurProp = (0, _useStableCallback.useStableCallback)(event => {
    if (restoringFocusVisibleRef.current) {
      return;
    }
    onBlurProp?.(event);
  });
  const defaultInputId = (0, _useBaseUiId.useBaseUiId)();
  const labelableId = (0, _useLabelableId.useLabelableId)();
  const inputId = range ? defaultInputId : labelableId;
  const thumbMetadata = React.useMemo(() => ({
    inputId
  }), [inputId]);
  const {
    ref: listItemRef,
    index: compositeIndex
  } = (0, _useCompositeListItem.useCompositeListItem)({
    metadata: thumbMetadata
  });
  const index = !range ? 0 : indexProp ?? compositeIndex;
  const last = index === sliderValues.length - 1;
  const thumbValue = sliderValues[index];
  const thumbValuePercent = (0, _valueToPercent.valueToPercent)(thumbValue, min, max);
  const [positionPercent, setPositionPercent] = React.useState();
  const isHydrating = (0, _useIsHydrating.useIsHydrating)();
  const safeLastUsedThumbIndex = lastUsedThumbIndex >= 0 && lastUsedThumbIndex < sliderValues.length ? lastUsedThumbIndex : -1;
  const getInsetPosition = (0, _useStableCallback.useStableCallback)(() => {
    const control = controlRef.current;
    const thumb = thumbRef.current;
    if (!control || !thumb) {
      return;
    }
    const thumbRect = thumb.getBoundingClientRect();
    const controlRect = control.getBoundingClientRect();
    const side = vertical ? 'height' : 'width';
    // the total travel distance adjusted to account for the thumb size
    const controlSize = controlRect[side] - thumbRect[side];
    // px distance from the starting edge (inline-start or bottom) to the thumb center
    const thumbOffsetFromControlEdge = thumbRect[side] / 2 + controlSize * thumbValuePercent / 100;
    const nextPositionPercent = thumbOffsetFromControlEdge / controlRect[side] * 100;
    const nextInsetPosition = Number.isFinite(nextPositionPercent) ? nextPositionPercent : undefined;
    setPositionPercent(nextInsetPosition);
    if (index === 0) {
      setIndicatorPosition(prevPosition => [nextInsetPosition, prevPosition[1]]);
    } else if (last) {
      setIndicatorPosition(prevPosition => [prevPosition[0], nextInsetPosition]);
    }
  });
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (inset) {
      queueMicrotask(getInsetPosition);
    }
  }, [getInsetPosition, inset]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (inset) {
      getInsetPosition();
    }
  }, [getInsetPosition, inset, thumbValuePercent]);
  (0, _useIsoLayoutEffect.useIsoLayoutEffect)(() => {
    if (!inset) {
      return undefined;
    }
    const control = controlRef.current;
    const thumb = thumbRef.current;
    if (!control || !thumb) {
      return undefined;
    }
    const ResizeObserverCtor = (0, _owner.ownerWindow)(control).ResizeObserver;
    if (typeof ResizeObserverCtor !== 'function') {
      return undefined;
    }
    const resizeObserver = new ResizeObserverCtor(getInsetPosition);
    resizeObserver.observe(control);
    resizeObserver.observe(thumb);
    return () => {
      resizeObserver.disconnect();
    };
  }, [controlRef, getInsetPosition, inset]);
  const startEdge = vertical ? 'bottom' : 'insetInlineStart';
  const crossOffsetProperty = vertical ? 'left' : 'top';
  let zIndex;
  if (range) {
    if (activeIndex === index) {
      zIndex = 2;
    } else if (safeLastUsedThumbIndex === index) {
      zIndex = 1;
    }
  } else if (activeIndex === index) {
    zIndex = 1;
  }
  let thumbStyle;
  if (!inset && !Number.isFinite(thumbValuePercent)) {
    thumbStyle = _visuallyHidden.visuallyHidden;
  } else {
    thumbStyle = {
      position: 'absolute',
      [startEdge]: inset ? 'var(--position)' : `${thumbValuePercent}%`,
      [crossOffsetProperty]: '50%',
      translate: `${(vertical || !rtl ? -1 : 1) * 50}% ${(vertical ? 1 : -1) * 50}%`,
      zIndex,
      ...(inset && {
        ['--position']: `${positionPercent ?? 0}%`,
        visibility: renderBeforeHydration && isHydrating || positionPercent === undefined ? 'hidden' : undefined
      })
    };
  }
  let cssWritingMode;
  if (vertical) {
    cssWritingMode = rtl ? 'vertical-rl' : 'vertical-lr';
  }
  const ariaLabel = typeof getAriaLabelProp === 'function' ? getAriaLabelProp(index) : ariaLabelProp;
  const inputProps = (0, _mergeProps.mergeProps)({
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledByProp ?? (ariaLabel == null ? labelId : undefined),
    'aria-describedby': ariaDescribedByProp,
    'aria-orientation': orientation,
    'aria-valuenow': thumbValue,
    'aria-valuetext': typeof getAriaValueTextProp === 'function' ? getAriaValueTextProp((0, _formatNumber.formatNumber)(thumbValue, locale, format), thumbValue, index) : ariaValueTextProp ?? getDefaultAriaValueText(sliderValues, index, format, locale),
    disabled,
    form,
    id: inputId,
    max,
    min,
    name,
    onChange(event) {
      handleInputChange(event.currentTarget.valueAsNumber, index, event);
    },
    onFocus(event) {
      const isRestoringFocusVisible = restoringFocusVisibleRef.current;
      restoringFocusVisibleRef.current = false;
      setActive(index);
      setFocused(true);
      if (isRestoringFocusVisible) {
        event.stopPropagation();
      }
    },
    onBlur(event) {
      if (restoringFocusVisibleRef.current) {
        event.stopPropagation();
        return;
      }
      setActive(-1);

      // Keep field-level blur logic from running while focus moves to another thumb
      // of the same slider, so validation doesn't commit mid-interaction.
      if (thumbRefs.current.some(thumb => (0, _utils.contains)(thumb, event.relatedTarget))) {
        return;
      }
      setTouched(true);
      setFocused(false);
      if (validationMode === 'onBlur') {
        validation.commit((0, _getSliderValue.getSliderValue)(thumbValue, index, min, max, range, sliderValues));
      }
    },
    onKeyDown(event) {
      if (event.defaultPrevented) {
        return;
      }
      if (!ALL_KEYS.has(event.key)) {
        return;
      }
      if (_composite.COMPOSITE_KEYS.has(event.key)) {
        event.stopPropagation();
      }
      let newValue = null;
      let direction = 0;
      let increment = event.shiftKey ? largeStep : step;
      const roundedValue = (0, _roundValueToStep.roundValueToStep)(thumbValue, step, min);
      switch (event.key) {
        case _composite.ARROW_UP:
          direction = 1;
          break;
        case _composite.ARROW_RIGHT:
          direction = rtl ? -1 : 1;
          break;
        case _composite.ARROW_DOWN:
          direction = -1;
          break;
        case _composite.ARROW_LEFT:
          direction = rtl ? 1 : -1;
          break;
        case _composite.PAGE_UP:
          increment = largeStep;
          direction = 1;
          break;
        case _composite.PAGE_DOWN:
          increment = largeStep;
          direction = -1;
          break;
        case _composite.END:
          newValue = range && Number.isFinite(sliderValues[index + 1]) ? sliderValues[index + 1] - step * minStepsBetweenValues : max;
          break;
        case _composite.HOME:
          newValue = range && Number.isFinite(sliderValues[index - 1]) ? sliderValues[index - 1] + step * minStepsBetweenValues : min;
          break;
        default:
          break;
      }
      if (direction !== 0) {
        newValue = getNewValue(roundedValue, increment, direction, min, max);
      }
      if (newValue !== null) {
        const input = event.currentTarget;
        if (!(0, _element.matchesFocusVisible)(input)) {
          restoringFocusVisibleRef.current = true;
          input.blur();
          input.focus({
            preventScroll: true,
            // Show `:focus-visible` after keyboard interaction, even if the
            // thumb was previously focused by a pointer.
            focusVisible: true
          });
        }
        handleInputChange(newValue, index, event);
        event.preventDefault();
      }
    },
    step,
    style: {
      ..._visuallyHidden.visuallyHidden,
      // So that VoiceOver's focus indicator matches the thumb's dimensions
      width: '100%',
      height: '100%',
      writingMode: cssWritingMode
    },
    tabIndex: tabIndexProp,
    type: 'range',
    value: thumbValue ?? ''
  }, props => validation.getValidationProps(disabled, props), {
    onFocus: handleFocusProp,
    onBlur: handleBlurProp,
    onKeyDown: onKeyDownProp
  });
  const mergedInputRef = (0, _useMergedRefs.useMergedRefs)(inputRef, validation.inputRef, inputRefProp);
  const element = (0, _useRenderElement.useRenderElement)('div', componentProps, {
    state,
    ref: [forwardedRef, listItemRef, thumbRef],
    props: [{
      [SliderThumbDataAttributes.index]: index,
      children: /*#__PURE__*/(0, _jsxRuntime.jsxs)(React.Fragment, {
        children: [childrenProp, /*#__PURE__*/(0, _jsxRuntime.jsx)("input", {
          ref: mergedInputRef,
          ...inputProps,
          suppressHydrationWarning: true
        }), inset && last && renderBeforeHydration && (_PrehydrationScript || (_PrehydrationScript = /*#__PURE__*/(0, _jsxRuntime.jsx)(_PrehydrationScript2.PrehydrationScript, {
          script: _thumb.script
        })))]
      }),
      id,
      onPointerDown(event) {
        // Keep disabled thumbs from writing transient pointer state.
        if (disabled) {
          return;
        }
        pressedThumbIndexRef.current = index;
        const midpoint = (0, _getMidpoint.getMidpoint)(event.currentTarget, vertical);
        pressedThumbCenterOffsetRef.current = (vertical ? event.clientY : event.clientX) - midpoint;
      },
      style: thumbStyle,
      suppressHydrationWarning: renderBeforeHydration || undefined
    }, elementProps],
    stateAttributesMapping: _stateAttributesMapping.sliderStateAttributesMapping
  });
  return element;
});
if (process.env.NODE_ENV !== "production") SliderThumb.displayName = "SliderThumb";