import type { ComponentChildren } from 'preact';

import './toggle.scss';

type ToggleProps = {
	id: string;
	name: string;
	value: string;
	form: string;
	defaultChecked?: boolean;
	label: ComponentChildren;
};

/**
 * Verbum's toggle switch, over a real checkbox so it posts with the form.
 *
 * @param props                - Component props.
 * @param props.id             - Element id, shared with the label.
 * @param props.name           - Field name to post under.
 * @param props.value          - Value to post when on.
 * @param props.form           - The id of the form it posts with.
 * @param props.defaultChecked - Whether it starts on.
 * @param props.label          - Text beside the switch.
 * @return The switch and its label.
 */
export const Toggle = ( props: ToggleProps ) => {
	const { id, name, value, form, defaultChecked, label } = props;

	return (
		<label htmlFor={ id } className="jetpack-comments__toggle">
			<input
				id={ id }
				name={ name }
				value={ value }
				form={ form }
				type="checkbox"
				defaultChecked={ defaultChecked }
			/>
			<span className="jetpack-comments__toggle-button" />
			<span className="jetpack-comments__toggle-text">{ label }</span>
		</label>
	);
};
