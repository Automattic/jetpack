import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.mjs";
import type { SliderRootState } from "../root/SliderRoot.mjs";
/**
 * The draggable part of the slider at the tip of the indicator.
 * Renders a `<div>` element and a nested `<input type="range">`.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export declare const SliderThumb: React.ForwardRefExoticComponent<Omit<SliderThumbProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ThumbMetadata {
  inputId: string | undefined;
}
export interface SliderThumbState extends SliderRootState {}
export interface SliderThumbProps extends Omit<BaseUIComponentProps<'div', SliderThumbState>, 'onBlur' | 'onFocus' | 'onKeyDown'> {
  /**
   * Whether the thumb should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * A string value forwarded to the [`aria-valuetext`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-valuetext) attribute of the `input`.
   * Ignored when `getAriaValueText` is provided.
   */
  'aria-valuetext'?: React.AriaAttributes['aria-valuetext'] | undefined;
  /**
   * A function which returns a string value for the [`aria-label`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label) attribute of the `input`.
   */
  getAriaLabel?: ((index: number) => string) | null | undefined;
  /**
   * A function which returns a string value for the [`aria-valuetext`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-valuetext) attribute of the `input`.
   * This is important for screen reader users.
   */
  getAriaValueText?: ((formattedValue: string, value: number, index: number) => string) | null | undefined;
  /**
   * The index of the thumb which corresponds to the index of its value in the
   * `value` or `defaultValue` array.
   * This prop is required to support server-side rendering for range sliders
   * with multiple thumbs.
   * @example
   * ```tsx
   * <Slider.Root value={[10, 20]}>
   *   <Slider.Thumb index={0} />
   *   <Slider.Thumb index={1} />
   * </Slider.Root>
   * ```
   */
  index?: number | undefined;
  /**
   * A ref to access the nested input element.
   */
  inputRef?: React.Ref<HTMLInputElement> | undefined;
  /**
   * A blur handler forwarded to the `input`.
   */
  onBlur?: React.FocusEventHandler<HTMLInputElement> | undefined;
  /**
   * A focus handler forwarded to the `input`.
   */
  onFocus?: React.FocusEventHandler<HTMLInputElement> | undefined;
  /**
   * A keydown handler forwarded to the `input`.
   */
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement> | undefined;
  /**
   * Optional tab index attribute forwarded to the `input`.
   */
  tabIndex?: number | undefined;
}
export declare namespace SliderThumb {
  type State = SliderThumbState;
  type Props = SliderThumbProps;
}