import type { ComponentChildren } from 'preact';
import './style.scss';

type Props = {
	id: string;
	checked: boolean;
	label: ComponentChildren;
	onChange: ( checked: boolean ) => void;
	disabled: boolean;
};

export function ToggleControl( { id, checked, onChange, label, disabled }: Props ) {
	return (
		<label htmlFor={ id } className="verbum-toggle-control">
			<input
				checked={ checked }
				type="checkbox"
				id={ id }
				onChange={ value => onChange( value.currentTarget.checked ) }
				disabled={ disabled }
			/>
			<span className="verbum-toggle-control__button"></span>
			<span className="verbum-toggle-control__text">{ label }</span>
		</label>
	);
}
