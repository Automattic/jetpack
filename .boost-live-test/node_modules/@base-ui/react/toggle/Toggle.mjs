'use client';

import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { error } from '@base-ui/utils/error';
import { useBaseUiId } from "../internals/useBaseUiId.mjs";
import { useRenderElement } from "../internals/useRenderElement.mjs";
import { useToggleGroupContext } from "../toggle-group/ToggleGroupContext.mjs";
import { useButton } from "../internals/use-button/useButton.mjs";
import { CompositeItem } from "../internals/composite/item/CompositeItem.mjs";
import { createChangeEventDetails } from "../internals/createBaseUIEventDetails.mjs";
import { REASONS } from "../internals/reasons.mjs";

/**
 * A two-state button that can be on or off.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 */
import { jsx as _jsx } from "react/jsx-runtime";
export const Toggle = /*#__PURE__*/React.forwardRef(function Toggle(componentProps, forwardedRef) {
  const {
    className,
    defaultPressed = false,
    disabled: disabledProp = false,
    form,
    // never participates in form validation
    onPressedChange,
    pressed: pressedProp,
    render,
    type,
    // cannot change button type
    value: valueProp,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;

  // `|| undefined` handles cases, where value is falsy (i.e. "")
  const value = useBaseUiId(valueProp || undefined);
  const groupContext = useToggleGroupContext();
  const groupValue = groupContext?.value ?? [];
  const disabled = (disabledProp || groupContext?.disabled) ?? false;
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      if (groupContext && valueProp === undefined && groupContext.isValueInitialized) {
        error('A `<Toggle>` component rendered in a `<ToggleGroup>` has no explicit `value` prop.', 'This will cause issues between the Toggle Group and Toggle values.', 'Provide the `<Toggle>` with a `value` prop matching the `<ToggleGroup>` values prop type.');
      }
    }, [groupContext, valueProp, groupContext?.isValueInitialized]);
  }
  const [pressed, setPressedState] = useControlled({
    controlled: groupContext ? value !== undefined && groupValue.indexOf(value) > -1 : pressedProp,
    default: defaultPressed,
    name: 'Toggle',
    state: 'pressed'
  });
  const {
    getButtonProps,
    buttonRef
  } = useButton({
    disabled,
    native: nativeButton
  });
  const state = {
    disabled,
    pressed
  };
  const refs = [buttonRef, forwardedRef];
  const props = [{
    'aria-pressed': pressed,
    onClick(event) {
      const nextPressed = !pressed;
      const details = createChangeEventDetails(REASONS.none, event.nativeEvent);

      // `onPressedChange` runs before the group commits so that canceling here
      // can also veto the group value change, which shares this `details` object.
      onPressedChange?.(nextPressed, details);
      if (details.isCanceled) {
        return;
      }
      if (value) {
        groupContext?.setGroupValue?.(value, nextPressed, details);
      }
      if (details.isCanceled) {
        return;
      }
      setPressedState(nextPressed);
    }
  }, elementProps, getButtonProps];
  const element = useRenderElement('button', componentProps, {
    enabled: !groupContext,
    state,
    ref: refs,
    props
  });

  // A disabled toggle is natively disabled and cannot hold roving focus.
  // Toolbar reads this metadata to compute its `disabledIndices`.
  const itemMetadata = React.useMemo(() => ({
    disabled,
    focusableWhenDisabled: false
  }), [disabled]);
  if (groupContext) {
    return /*#__PURE__*/_jsx(CompositeItem, {
      tag: "button",
      render: render,
      className: className,
      style: style,
      metadata: itemMetadata,
      state: state,
      refs: refs,
      props: props
    });
  }
  return element;
});
if (process.env.NODE_ENV !== "production") Toggle.displayName = "Toggle";