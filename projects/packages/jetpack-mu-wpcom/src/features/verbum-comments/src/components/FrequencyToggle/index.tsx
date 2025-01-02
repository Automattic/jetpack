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

/**
 * Frequency toggle component.
 * @param {FrequencyToggleProps} props                - props
 * @param {string}               props.name           - name of the radio group
 * @param {Option[]}             props.initialOptions - the options to pick one from
 * @param {Function}             props.onChange       - callback when the selected option changes
 * @param {Option[]}             props.selectedOption - the currently selected option
 * @param {boolean}              props.disabled       - whether the toggle is disabled
 * @return {JSX.Element} The rendered component.
 */
export function FrequencyToggle( {
	name = 'frequency-toggle',
	initialOptions,
	onChange,
	selectedOption,
	disabled,
}: FrequencyToggleProps ): JSX.Element {
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
							<span className="text" role="radio" aria-checked={ option.value === selectedOption }>
								{ option.label }
							</span>
						</label>
					</Fragment>
				) ) }
			</fieldset>
		</div>
	);
}
