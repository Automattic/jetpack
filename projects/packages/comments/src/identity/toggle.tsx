import type { ComponentChildren } from 'preact';

import './toggle.scss';

type ToggleProps = {
	id: string;
	checked: boolean;
	onChange: ( checked: boolean ) => void;
	label: ComponentChildren;
};

/**
 * Verbum's toggle switch, drawn on the checkbox itself.
 *
 * @param props          - Component props.
 * @param props.id       - Element id, shared with the label.
 * @param props.checked  - Whether it is on.
 * @param props.onChange - Called with the new state.
 * @param props.label    - Text beside the switch.
 * @return The switch and its label.
 */
export const Toggle = ( props: ToggleProps ) => {
	const { id, checked, onChange, label } = props;

	return (
		<label htmlFor={ id } className="jetpack-comments__toggle">
			<input
				id={ id }
				type="checkbox"
				role="switch"
				checked={ checked }
				onChange={ event => onChange( event.currentTarget.checked ) }
			/>
			<span className="jetpack-comments__toggle-text">{ label }</span>
		</label>
	);
};
