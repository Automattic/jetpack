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
