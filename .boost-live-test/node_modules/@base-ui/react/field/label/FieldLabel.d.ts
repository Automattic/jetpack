import * as React from 'react';
import type { FieldRootState } from "../root/FieldRoot.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An accessible label that is automatically associated with the field control.
 * Renders a `<label>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export declare const FieldLabel: React.ForwardRefExoticComponent<Omit<FieldLabelProps, "ref"> & React.RefAttributes<HTMLElement>>;
export interface FieldLabelState extends FieldRootState {}
export interface FieldLabelProps extends BaseUIComponentProps<'label', FieldLabelState> {
  /**
   * Whether the component renders a native `<label>` element when replacing it via the `render` prop.
   * Set to `false` if the rendered element is not a label (for example, `<div>`).
   *
   * This is useful to avoid inheriting label behaviors on `<button>` controls (such as `<Select.Trigger>` and `<Combobox.Trigger>`), including avoiding `:hover` on the button when hovering the label, and preventing clicks on the label from firing on the button.
   * @default true
   */
  nativeLabel?: boolean | undefined;
}
export declare namespace FieldLabel {
  type State = FieldLabelState;
  type Props = FieldLabelProps;
}