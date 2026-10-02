import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * Groups a shared legend with related controls.
 * Renders a `<fieldset>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
export declare const FieldsetRoot: React.ForwardRefExoticComponent<Omit<FieldsetRootProps, "ref"> & React.RefAttributes<HTMLElement>>;
export interface FieldsetRootState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}
export interface FieldsetRootProps extends BaseUIComponentProps<'fieldset', FieldsetRootState> {}
export declare namespace FieldsetRoot {
  type State = FieldsetRootState;
  type Props = FieldsetRootProps;
}