import type { ComponentChildren } from 'preact';

import './style.scss';

type ToggleProps = {
	id: string;
	label: ComponentChildren;
	description?: ComponentChildren;
	name?: string;
	value?: string;
	checked?: boolean;
	defaultChecked?: boolean;
	disabled?: boolean;
	onChange?: ( checked: boolean ) => void;
};

/**
 * A checkbox drawn as a switch.
 *
 * @param props                - Component props.
 * @param props.id             - Element id, shared with the label.
 * @param props.label          - Text shown beside the switch.
 * @param props.description    - Smaller text under the label.
 * @param props.name           - Field name to post under.
 * @param props.value          - Value to post when checked.
 * @param props.checked        - The state, for a controlled switch.
 * @param props.defaultChecked - Whether an uncontrolled switch starts on.
 * @param props.disabled       - Whether the switch is inert.
 * @param props.onChange       - Called with the new state.
 * @return The switch and its label.
 */
export const Toggle = ( props: ToggleProps ) => {
	const { id, label, description, name, value, checked, defaultChecked, disabled, onChange } =
		props;

	return (
		<label className="jetpack-comments__toggle" htmlFor={ id }>
			<input
				id={ id }
				name={ name }
				type="checkbox"
				value={ value }
				checked={ checked }
				defaultChecked={ defaultChecked }
				disabled={ disabled }
				onChange={ event => onChange?.( event.currentTarget.checked ) }
			/>
			<span className="jetpack-comments__toggle-switch" />
			<span className="jetpack-comments__toggle-text">
				<span className="jetpack-comments__toggle-label">{ label }</span>
				{ description && (
					<span className="jetpack-comments__toggle-description">{ description }</span>
				) }
			</span>
		</label>
	);
};
