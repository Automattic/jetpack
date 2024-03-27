import type { ComponentChildren, FunctionComponent } from 'preact';
import './style.scss';

type Props = {
	id: string;
	checked: boolean;
	label: ComponentChildren;
	onChange: ( checked: boolean ) => void;
	disabled: boolean;
};
export const ToggleControl: FunctionComponent< Props > = ( {
	id,
	checked,
	onChange,
	label,
	disabled,
} ) => {
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
};
