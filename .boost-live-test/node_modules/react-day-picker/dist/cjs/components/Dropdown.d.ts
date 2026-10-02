import React, { type SelectHTMLAttributes } from "react";
/** An option to use in the dropdown. Maps to the `<option>` HTML element. */
export type DropdownOption = {
    /** The value of the option. */
    value: number;
    /** The label of the option. */
    label: string;
    /** Whether the dropdown option is disabled (e.g., out of the calendar range). */
    disabled: boolean;
};
/**
 * Render a dropdown component for navigation in the calendar.
 *
 * @group Components
 * @see https://daypicker.dev/guides/custom-components
 */
export declare function Dropdown(props: {
    /** The options to display in the dropdown. */
    options?: DropdownOption[] | undefined;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "children">): React.JSX.Element;
/** Props accepted by the {@link Dropdown} component. */
export type DropdownProps = Parameters<typeof Dropdown>[0];
