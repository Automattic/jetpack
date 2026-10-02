import React from "react";
import { UI } from "../UI.js";
import { useDayPicker } from "../useDayPicker.js";
/**
 * Render a dropdown component for navigation in the calendar.
 *
 * @group Components
 * @see https://daypicker.dev/guides/custom-components
 */
export function Dropdown(props) {
    const { options, className, ...selectProps } = props;
    const { classNames, components, styles } = useDayPicker();
    const cssClassSelect = [classNames[UI.Dropdown], className].join(" ");
    const selectedOption = options?.find(({ value }) => value === selectProps.value);
    return (React.createElement("span", { "data-disabled": selectProps.disabled, className: classNames[UI.DropdownRoot], style: styles?.[UI.DropdownRoot] },
        React.createElement(components.Select, { className: cssClassSelect, ...selectProps }, options?.map(({ value, label, disabled }) => (React.createElement(components.Option, { key: value, value: value, disabled: disabled }, label)))),
        React.createElement("span", { className: classNames[UI.CaptionLabel], style: styles?.[UI.CaptionLabel], "aria-hidden": true },
            selectedOption?.label,
            React.createElement(components.Chevron, { orientation: "down", size: 18, className: classNames[UI.Chevron], style: styles?.[UI.Chevron] }))));
}
