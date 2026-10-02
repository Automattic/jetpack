import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from "../internals/types.js";
import { type BaseUIChangeEventDetails } from "../internals/createBaseUIEventDetails.js";
import { REASONS } from "../internals/reasons.js";
/**
 * A two-state button that can be on or off.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Toggle](https://base-ui.com/react/components/toggle)
 */
export declare const Toggle: {
  <Value extends string>(props: Toggle.Props<Value> & React.RefAttributes<HTMLButtonElement>): React.JSX.Element;
};
export interface ToggleState {
  /**
   * Whether the toggle is currently pressed.
   */
  pressed: boolean;
  /**
   * Whether the toggle should ignore user interaction.
   */
  disabled: boolean;
}
export interface ToggleProps<Value extends string> extends NativeButtonProps, BaseUIComponentProps<'button', ToggleState> {
  /**
   * Whether the toggle button is currently pressed.
   * This is the controlled counterpart of `defaultPressed`.
   */
  pressed?: boolean | undefined;
  /**
   * Whether the toggle button is currently pressed.
   * This is the uncontrolled counterpart of `pressed`.
   * @default false
   */
  defaultPressed?: boolean | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Callback fired when the pressed state is changed.
   */
  onPressedChange?: ((pressed: boolean, eventDetails: Toggle.ChangeEventDetails) => void) | undefined;
  /**
   * A unique string that identifies the toggle when used
   * inside a toggle group.
   */
  value?: Value | undefined;
}
export type ToggleChangeEventReason = typeof REASONS.none;
export type ToggleChangeEventDetails = BaseUIChangeEventDetails<Toggle.ChangeEventReason>;
export declare namespace Toggle {
  type State = ToggleState;
  type Props<TValue extends string = string> = ToggleProps<TValue>;
  type ChangeEventReason = ToggleChangeEventReason;
  type ChangeEventDetails = ToggleChangeEventDetails;
}