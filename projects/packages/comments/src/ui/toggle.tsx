import type { ComponentChildren } from 'preact';

import './style.scss';

type ToggleProps = {
	id: string;
	name: string;
	value: string;
	label: ComponentChildren;
	defaultChecked?: boolean;
};

/**
 * A checkbox drawn as a switch. It stays a real checkbox so the form posts it
 * without any help.
 *
 * @param props                - Component props.
 * @param props.id             - Element id, shared with the label.
 * @param props.name           - Field name to post under.
 * @param props.value          - Value to post when checked.
 * @param props.label          - Text shown beside the switch.
 * @param props.defaultChecked - Whether it starts on.
 * @return The switch and its label.
 */
export const Toggle = ( props: ToggleProps ) => {
	const { id, name, value, label, defaultChecked } = props;

	return (
		<label className="jetpack-comments__toggle" htmlFor={ id }>
			<input
				id={ id }
				name={ name }
				type="checkbox"
				value={ value }
				defaultChecked={ defaultChecked }
			/>
			<span className="jetpack-comments__toggle-switch" />
			<span className="jetpack-comments__toggle-text">{ label }</span>
		</label>
	);
};
