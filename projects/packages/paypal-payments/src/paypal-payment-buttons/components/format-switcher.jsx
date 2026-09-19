/**
 * PayPal Payment Buttons — Display format switcher.
 *
 * @package
 */

import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

// Stacked buttons are built but not offered: integration_mode BUTTON is sandbox-only
// ahead of PayPal's beta. Flip to true to test, false before merge.
// SPIKE-WOOPTP-496-CANVAS-SDK: true for the POC. This is the one line to flip back.
const ENABLE_STACKED = true;

/**
 * Format options for the format switcher.
 *
 * Order follows the design's Embed as menu — Single, Stacked, QR, Link. The
 * reorder is visible to every merchant even while STACKED is dark, which is what
 * the design asks for.
 */
const FORMAT_OPTIONS = [
	{ value: 'BUTTON', label: __( 'Single button', 'jetpack-paypal-payments' ) },
	...( ENABLE_STACKED
		? [ { value: 'STACKED', label: __( 'Stacked buttons', 'jetpack-paypal-payments' ) } ]
		: [] ),
	{ value: 'QR', label: __( 'QR code', 'jetpack-paypal-payments' ) },
	{ value: 'LINK', label: __( 'Link', 'jetpack-paypal-payments' ) },
];

/**
 * Help text shown below the format switcher, keyed by format value.
 */
const FORMAT_HELP = {
	BUTTON: __( 'Embed a clickable PayPal button on your page.', 'jetpack-paypal-payments' ),
	LINK: __( 'Display a URL link that opens PayPal checkout.', 'jetpack-paypal-payments' ),
	QR: __( 'Show a scannable QR code for print or digital use.', 'jetpack-paypal-payments' ),
	// SPIKE-WOOPTP-496-CANVAS-SDK: copy in the shape of its siblings, for the copy batch to revise.
	STACKED: __( 'Show PayPal, Venmo and Checkout buttons together.', 'jetpack-paypal-payments' ),
};

/**
 * Format switcher — the Styles tab's Embed as control.
 *
 * @param {object}   props          - Component props.
 * @param {string}   props.value    - Current format value ('BUTTON' | 'LINK' | 'QR').
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
			help={ FORMAT_HELP[ activeValue ] }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
		/>
	);
}
