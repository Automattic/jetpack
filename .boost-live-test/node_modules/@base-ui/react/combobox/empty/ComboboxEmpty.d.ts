import * as React from 'react';
import { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Renders its children only when the list is empty.
 * Requires the `items` prop on the root component.
 * Announces changes politely to screen readers.
 * This component's root element must remain mounted in the DOM to announce
 * changes consistently across screen readers. Avoid hiding or removing the
 * component itself with `display: none`, `hidden`, `aria-hidden`, or conditional
 * rendering. Prefer updating or conditionally rendering its children instead.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export declare const ComboboxEmpty: React.ForwardRefExoticComponent<Omit<ComboboxEmptyProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface ComboboxEmptyState {}
export interface ComboboxEmptyProps extends BaseUIComponentProps<'div', ComboboxEmptyState> {}
export declare namespace ComboboxEmpty {
  type State = ComboboxEmptyState;
  type Props = ComboboxEmptyProps;
}