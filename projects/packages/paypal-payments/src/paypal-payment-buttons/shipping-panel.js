/* eslint-disable react/jsx-no-bind */
/**
 * Shipping Configuration Panel.
 *
 * InspectorControls panel for configuring shipping costs and
 * address collection on PayPal payment buttons.
 *
 * @package
 * @since 0.9.0
 */

import { SelectControl, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const SHIPPING_TYPE_OPTIONS = [
	{ label: __( 'Flat rate', 'jetpack-paypal-payments' ), value: 'FLAT' },
	{ label: __( 'Use PayPal profile settings', 'jetpack-paypal-payments' ), value: 'PREFERENCE' },
];

/**
 * Shipping configuration panel content.
 *
 * @param {object}   props                        - Component props.
 * @param {boolean}  props.collectShippingAddress - Whether to collect address.
 * @param {boolean}  props.shippingEnabled        - Whether shipping cost is enabled.
 * @param {string}   props.shippingType           - FLAT or PREFERENCE.
 * @param {string}   props.shippingValue          - Flat rate value.
 * @param {string}   props.currencyCode           - Product currency code.
 * @param {Function} props.onChange               - Callback with attribute updates.
 * @param {boolean}  props.disabled               - Whether inputs are disabled.
 * @return {Element} Shipping panel content.
 */
export default function ShippingPanel( {
	collectShippingAddress,
	shippingEnabled,
	shippingType,
	shippingValue,
	currencyCode = 'USD',
	onChange,
	disabled,
} ) {
	return (
		<div className="jetpack-paypal-shipping">
			<ToggleControl
				label={ __( 'Collect shipping address', 'jetpack-paypal-payments' ) }
				help={ __(
					'Require customers to provide a shipping address at checkout.',
					'jetpack-paypal-payments'
				) }
				checked={ collectShippingAddress }
				onChange={ value => onChange( { collectShippingAddress: value } ) }
				disabled={ disabled }
			/>

			<ToggleControl
				label={ __( 'Add shipping cost', 'jetpack-paypal-payments' ) }
				help={ __( 'Include a shipping fee in the checkout total.', 'jetpack-paypal-payments' ) }
				checked={ shippingEnabled }
				onChange={ value => onChange( { shippingEnabled: value } ) }
				disabled={ disabled }
			/>

			{ shippingEnabled && (
				<>
					<SelectControl
						label={ __( 'Shipping type', 'jetpack-paypal-payments' ) }
						value={ shippingType || 'FLAT' }
						options={ SHIPPING_TYPE_OPTIONS }
						onChange={ value => onChange( { shippingType: value } ) }
						disabled={ disabled }
					/>

					{ shippingType !== 'PREFERENCE' && (
						<TextControl
							label={ __( 'Shipping cost', 'jetpack-paypal-payments' ) }
							value={ shippingValue || '' }
							onChange={ value => onChange( { shippingValue: value } ) }
							type="number"
							min="0.01"
							step="0.01"
							placeholder="5.99"
							help={ currencyCode }
							disabled={ disabled }
						/>
					) }
				</>
			) }
		</div>
	);
}
