/* eslint-disable react/jsx-no-bind */
/**
 * A money or percentage field with the unit inside it.
 *
 * InputControl draws its own label and help and owns the suffix slot, so this only
 * adds the error handling the other fields in this block already use.
 *
 * @package
 * @since 0.9.0
 */

import {
	__experimentalInputControl as InputControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';

/**
 * Amount or percentage input with the unit inside the field.
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.label         - Field label.
 * @param {string}   props.value         - Current value.
 * @param {Function} props.onChange      - Called with the new value.
 * @param {string}   props.suffix        - The unit shown inside the field, e.g. '%' or '$'.
 * @param {string}   [props.step]        - Input step.
 * @param {string}   [props.min]         - Smallest value the spinner offers.
 * @param {string}   [props.max]         - Largest value the spinner offers.
 * @param {string}   [props.placeholder]
 *                                       - Placeholder text.
 * @param {string}   [props.error]       - Error message, shown under the field.
 * @param {boolean}  [props.disabled]    - Whether the field is disabled.
 * @return {Element} The field.
 */
export default function AmountField( {
	label,
	value,
	onChange,
	suffix,
	step,
	min,
	max,
	placeholder,
	error,
	disabled,
} ) {
	return (
		<InputControl
			label={ label }
			value={ value || '' }
			// InputControl hands back undefined on an emptied field where TextControl gives ''.
			onChange={ next => onChange( next ?? '' ) }
			type="number"
			step={ step }
			min={ min }
			max={ max }
			placeholder={ placeholder }
			// The wrapper is what pads the suffix off the field's edge.
			suffix={ <InputControlSuffixWrapper>{ suffix }</InputControlSuffixWrapper> }
			help={ error }
			className={ error ? 'jetpack-paypal-payment-buttons__has-error' : undefined }
			disabled={ disabled }
		/>
	);
}
