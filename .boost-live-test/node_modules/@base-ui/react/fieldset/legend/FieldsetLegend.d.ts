import * as React from 'react';
import type { BaseUIComponentProps } from "../../internals/types.js";
/**
 * An accessible label that is automatically associated with the fieldset.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Fieldset](https://base-ui.com/react/components/fieldset)
 */
export declare const FieldsetLegend: React.ForwardRefExoticComponent<Omit<FieldsetLegendProps, "ref"> & React.RefAttributes<HTMLDivElement>>;
export interface FieldsetLegendState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}
export interface FieldsetLegendProps extends BaseUIComponentProps<'div', FieldsetLegendState> {}
export declare namespace FieldsetLegend {
  type State = FieldsetLegendState;
  type Props = FieldsetLegendProps;
}