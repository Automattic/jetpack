/**
 * PayPal Payment Buttons - Amount field.
 *
 * InputControl draws the label, the help and the suffix, so this adds the error
 * handling the rest of the block's fields already use.
 *
 * @package
 * @since 0.9.0
 */

import {
	__experimentalInputControl as InputControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalInputControlSuffixWrapper as InputControlSuffixWrapper, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import clsx from 'clsx';

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
 * @param {string}   [props.help]        - Hint shown under the field, error or not.
 * @param {string}   [props.error]       - Error message, shown below the hint.
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
	help,
	error,
	disabled,
} ) {
	return (
		<InputControl
			label={ label }
			value={ value || '' }
			onChange={ onChange }
			type="number"
			step={ step }
			min={ min }
			max={ max }
			placeholder={ placeholder }
			// The wrapper is what pads the suffix off the field's edge.
			suffix={ <InputControlSuffixWrapper>{ suffix }</InputControlSuffixWrapper> }
			// Hint and error stack, each in its own span so editor.scss can redden the error
			// alone.
			help={
				( help || error ) && (
					<>
						{ help && <span>{ help }</span> }
						{ error && (
							<span className="jetpack-paypal-payment-buttons__field-error">{ error }</span>
						) }
					</>
				)
			}
			className={ clsx( 'jetpack-paypal-payment-buttons__field', {
				'jetpack-paypal-payment-buttons__has-error': error,
			} ) }
			disabled={ disabled }
		/>
	);
}
