/**
 * PayPal Payment Buttons — Display format switcher.
 *
 * @package
 */

import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Format options for the format switcher.
 *
 * Stacked is offered to every account: PayPal grants the integration_mode it needs per
 * account, and only a save finds out. The save path says so once PayPal answers.
 */
const FORMAT_OPTIONS = [
	{ value: 'BUTTON', label: __( 'Single button', 'jetpack-paypal-payments' ) },
	{ value: 'STACKED', label: __( 'Stacked buttons', 'jetpack-paypal-payments' ) },
	{ value: 'CHECKOUT', label: __( 'Checkout on this page', 'jetpack-paypal-payments' ) },
	{ value: 'QR', label: __( 'QR code', 'jetpack-paypal-payments' ) },
	{ value: 'LINK', label: __( 'Link', 'jetpack-paypal-payments' ) },
];

/**
 * Format switcher — the Styles tab's Embed as control.
 *
 * @param {object}   props          - Component props.
 * @param {string}   props.value    - Current format value ('BUTTON' | 'STACKED' | 'CHECKOUT' | 'LINK' | 'QR').
 * @param {Function} props.onChange - Callback when format changes.
 * @param {boolean}  props.disabled - Whether the switcher is disabled.
 * @return {Element} The format switcher UI.
 */
export default function FormatSwitcher( { value, onChange, disabled } ) {
	const activeValue = value || 'BUTTON';

	return (
		<SelectControl
			className="jetpack-paypal-payment-buttons__format-switcher"
			label={ __( 'Embed as', 'jetpack-paypal-payments' ) }
			value={ activeValue }
			options={ FORMAT_OPTIONS }
			onChange={ onChange }
			disabled={ disabled }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
		/>
	);
}
