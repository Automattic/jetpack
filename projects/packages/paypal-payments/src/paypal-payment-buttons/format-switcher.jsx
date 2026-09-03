/* eslint-disable react/jsx-no-bind */
/**
 * PayPal Payment Buttons — Display format switcher.
 *
 * @package
 * @since 0.9.0
 */

import { Button, ButtonGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Format options for the format switcher.
 */
export const FORMAT_OPTIONS = [
	{ value: 'BUTTON', label: __( 'Button', 'jetpack-paypal-payments' ) },
	{ value: 'LINK', label: __( 'Link', 'jetpack-paypal-payments' ) },
	{ value: 'QR', label: __( 'QR Code', 'jetpack-paypal-payments' ) },
];

/**
 * Help text shown below the format switcher, keyed by format value.
 */
const FORMAT_HELP = {
	BUTTON: __( 'Embed a clickable PayPal button on your page.', 'jetpack-paypal-payments' ),
	LINK: __( 'Display a URL link that opens PayPal checkout.', 'jetpack-paypal-payments' ),
	QR: __( 'Show a scannable QR code for print or digital use.', 'jetpack-paypal-payments' ),
};

/**
 * Format switcher component — shared between the creation form and InspectorControls.
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
		<div className="jetpack-paypal-payment-buttons__format-switcher">
			<p className="components-base-control__label">
				{ __( 'Display Format', 'jetpack-paypal-payments' ) }
			</p>
			<ButtonGroup>
				{ FORMAT_OPTIONS.map( option => (
					<Button
						key={ option.value }
						variant={ activeValue === option.value ? 'primary' : 'secondary' }
						onClick={ () => onChange( option.value ) }
						disabled={ disabled }
						aria-pressed={ activeValue === option.value }
					>
						{ option.label }
					</Button>
				) ) }
			</ButtonGroup>
			<p className="jetpack-paypal-payment-buttons__format-help">{ FORMAT_HELP[ activeValue ] }</p>
		</div>
	);
}
