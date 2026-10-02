import * as React from 'react';
import { type FieldRootState } from "../root/FieldRoot.js";
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * A paragraph with additional information about the field.
 * Renders a `<p>` element.
 *
 * Documentation: [Base UI Field](https://base-ui.com/react/components/field)
 */
export declare const FieldDescription: React.ForwardRefExoticComponent<Omit<FieldDescriptionProps, "ref"> & React.RefAttributes<HTMLParagraphElement>>;
export interface FieldDescriptionState extends FieldRootState {}
export interface FieldDescriptionProps extends BaseUIComponentProps<'p', FieldDescriptionState> {}
export declare namespace FieldDescription {
  type State = FieldDescriptionState;
  type Props = FieldDescriptionProps;
}