import { Fragment } from 'preact';
import './style.scss';

type FrequencyToggleProps = {
	initialOptions: Option[];
	onChange?: ( deliveryFrequency: string ) => void;
	selectedOption: string;
	disabled?: boolean;
	name: string;
};

type Option = {
	value: string;
	checked: boolean;
	label: string;
};

export function FrequencyToggle( {
	name = 'frequency-toggle',
	initialOptions,
	onChange,
	selectedOption,
	disabled,
}: FrequencyToggleProps ) {
	return (
		<div className="verbum-frequency-toggle">
			<fieldset className="fieldset" disabled={ disabled }>
				{ initialOptions.map( ( option, index ) => (
					<Fragment key={ index }>
						<input
							aria-hidden="true"
							aria-checked={ option.checked ? true : false }
							type="radio"
							name={ name }
							id={ option.value }
							value={ option.value }
							checked={ option.value === selectedOption }
							onChange={ () => onChange( option.value ) }
							disabled={ disabled }
						/>
						<label aria-label={ option.value } htmlFor={ option.value } className="label-wrapper">
							<span className="text" role="radio">
								{ option.label }
							</span>
						</label>
					</Fragment>
				) ) }
			</fieldset>
		</div>
	);
}
