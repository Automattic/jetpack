/**
 * Build the body of a PayPal payment from a block's attributes.
 *
 * @package
 */

import { withCurrency } from './resource-sync';

/**
 * Whether a shipping mode has everything it needs to go out.
 *
 * PROFILE and FREE carry their own value. The two fee modes need an amount, and
 * '0' is one PayPal stores, so this tests the string rather than truthiness.
 *
 * @param {string} mode  - PROFILE, QUANTITY, FLAT or FREE.
 * @param {string} value - The fee.
 * @return {boolean} True when the entry can be built.
 */
function hasShippingValue( mode, value ) {
	return 'PROFILE' === mode || 'FREE' === mode || '' !== ( value ?? '' );
}

/**
 * Build the single `shipping` entry a mode sends.
 *
 * Four modes collapse onto two PayPal types, so the wire cannot round-trip the
 * mode on its own - PROFILE and FREE share `PREFERENCE`, FLAT and QUANTITY share
 * `FLAT` and differ only by `additional_unit_value`. The mapper reads them back
 * apart the same way.
 *
 * @param {string} mode       - PROFILE, QUANTITY, FLAT or FREE.
 * @param {string} value      - The fee, or the first-item fee under QUANTITY.
 * @param {string} additional - The per-extra-item fee. QUANTITY only, optional.
 * @return {object} The entry.
 */
function buildShipping( mode, value, additional ) {
	if ( 'PROFILE' === mode ) {
		return { type: 'PREFERENCE', value: 'PROFILE' };
	}

	if ( 'FREE' === mode ) {
		return { type: 'PREFERENCE', value: 'FREE_SHIPPING' };
	}

	return {
		type: 'FLAT',
		value,
		...( 'QUANTITY' === mode && '' !== ( additional ?? '' )
			? { additional_unit_value: additional }
			: {} ),
	};
}

/**
 * Build the create/update request body from block attributes.
 *
 * @param {object}  attributes         - Block attributes.
 * @param {boolean} usesVariantPricing - Whether the options group carries its own prices.
 * @return {object} API request data.
 */
export function buildRequestData( attributes, usesVariantPricing ) {
	const {
		productName,
		price,
		currencyCode,
		productDescription,
		productId,
		imageUrl,
		returnUrl,
		variantsEnabled,
		variants,
		adjustableQuantity,
		maxQuantity,
		customerNotes,
		taxEnabled,
		taxType,
		taxName,
		taxValue,
		handlingEnabled,
		handlingValue,
		discountEnabled,
		discountType,
		discountValue,
		shippingEnabled,
		shippingMode,
		shippingValue,
		shippingAdditionalValue,
		collectShippingAddress,
	} = attributes;

	// The form blocks a blank rate before it reaches here, so this is a backstop:
	// no value, no tax. Test the string, because '0' is a value PayPal stores.
	const taxAmount = 'PREFERENCE' === taxType ? 'PROFILE' : taxValue;

	return {
		type: 'BUY_NOW',
		integration_mode: 'LINK',
		reusable: 'MULTIPLE',
		line_items: [
			{
				name: productName,
				// PayPal errors with "unit_amount is specified at both product
				// level and variant level" when both are present, so the
				// product-level amount is dropped once options are priced.
				...( usesVariantPricing
					? {}
					: {
							unit_amount: {
								currency_code: currencyCode || 'USD',
								value: price,
							},
					  } ),
				...( productDescription ? { description: productDescription } : {} ),
				// '0' is a valid product id, so blank is a trim check, not truthiness.
				...( productId?.trim() ? { product_id: productId.trim() } : {} ),
				// The block owns the image: leaving it out here removes it at PayPal.
				...( imageUrl ? { image_url: imageUrl } : {} ),
				...( variantsEnabled && variants
					? { variants: withCurrency( variants, currencyCode || 'USD' ) }
					: {} ),
				...( adjustableQuantity && maxQuantity > 1
					? { adjustable_quantity: { maximum: parseInt( maxQuantity, 10 ) } }
					: {} ),
				...( customerNotes?.length > 0
					? { customer_notes: customerNotes.filter( n => n.label?.trim() ) }
					: {} ),
				...( taxEnabled && '' !== ( taxAmount ?? '' )
					? {
							taxes: [
								{
									// PayPal supplies the label, so the name is
									// its own only when the payment already has
									// one. Sending an empty one would overwrite it.
									...( taxName ? { name: taxName } : {} ),
									type: taxType || 'PERCENTAGE',
									value: taxAmount,
								},
							],
					  }
					: {} ),
				// FLAT is the only type PayPal takes here. Same blank check as the
				// tax above: '0' is a fee PayPal stores and reads back.
				...( handlingEnabled && '' !== ( handlingValue ?? '' )
					? { handling: [ { type: 'FLAT', value: handlingValue } ] }
					: {} ),
				// The attribute holds PayPal's own type, so it goes out as it stands.
				// Blank check as above; a zero never gets here, the validator blocks it.
				...( discountEnabled && '' !== ( discountValue ?? '' )
					? { discounts: [ { type: discountType || 'FLAT', value: discountValue } ] }
					: {} ),
				// A fee mode with no amount would send an empty value, so it is gated
				// the same way the fees above are. The two preference modes carry their
				// own value and need no amount at all.
				...( shippingEnabled && hasShippingValue( shippingMode, shippingValue )
					? { shipping: [ buildShipping( shippingMode, shippingValue, shippingAdditionalValue ) ] }
					: {} ),
				// Omitting this makes PayPal collect an address whatever the payment
				// said before, so it goes out on every request. The design nests the
				// checkbox under the toggle, so shipping off means no address either.
				collect_shipping_address: !! ( shippingEnabled && collectShippingAddress ),
			},
		],
		...( returnUrl ? { return_url: returnUrl } : {} ),
	};
}
