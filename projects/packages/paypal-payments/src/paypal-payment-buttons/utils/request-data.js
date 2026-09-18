/**
 * Build the body of a PayPal payment from a block's attributes.
 *
 * @package
 */

import { withCurrency } from './resource-sync';
import { SHIPPING_MODES_WITH_FEE } from './validation';

/**
 * Whether a shipping mode has everything it needs to go out.
 *
 * PROFILE and FREE send their own value. FLAT and QUANTITY need a fee, and '0' is a
 * fee PayPal stores, so the test is for a blank string.
 *
 * @param {string} mode  - PROFILE, QUANTITY, FLAT or FREE.
 * @param {string} value - The fee.
 * @return {boolean} True when the entry can be built.
 */
function hasShippingValue( mode, value ) {
	return ! SHIPPING_MODES_WITH_FEE.includes( mode ) || '' !== ( value ?? '' );
}

/**
 * Build the single `shipping` entry a mode sends.
 *
 * Four modes map onto two PayPal types: PROFILE and FREE share `PREFERENCE`, FLAT
 * and QUANTITY share `FLAT` plus `additional_unit_value`. The mapper reads them back.
 *
 * @param {string} mode       - PROFILE, QUANTITY, FLAT or FREE.
 * @param {string} value      - The fee, or the first-item fee under QUANTITY.
 * @param {string} additional - The per-extra-item fee. QUANTITY only, optional.
 * @return {object} The entry.
 */
function buildShipping( mode, value, additional ) {
	if ( ! SHIPPING_MODES_WITH_FEE.includes( mode ) ) {
		return { type: 'PREFERENCE', value: 'FREE' === mode ? 'FREE_SHIPPING' : 'PROFILE' };
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
		format,
		integrationMode,
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

	// PREFERENCE takes its rate from the merchant's PayPal profile.
	const taxAmount = 'PREFERENCE' === taxType ? 'PROFILE' : taxValue;

	// FLAT is the default the editor and the validator both fall back to.
	const activeShippingMode = shippingMode || 'FLAT';

	return {
		type: 'BUY_NOW',
		// A stacked block needs the payment in BUTTON mode — that is what makes
		// PayPal return code_snippets, and so the SDK URL, on the next GET.
		//
		// Everything else re-sends the mode the payment already has, and never a
		// hardcoded 'LINK'. Two blocks can share one payment, and a downgrade would
		// drop code_snippets, clear the stacked block's scriptSrc on its next mount
		// and blank it — then restore it on the next save, so it flaps rather than
		// dies. An empty attribute means "never read one", which is LINK.
		integration_mode: 'STACKED' === format ? 'BUTTON' : integrationMode || 'LINK',
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
				// FLAT is the only type PayPal takes here, and '0' is a fee it stores.
				...( handlingEnabled && '' !== ( handlingValue ?? '' )
					? { handling: [ { type: 'FLAT', value: handlingValue } ] }
					: {} ),
				// The attribute holds PayPal's own type, so it goes out as it stands.
				...( discountEnabled && '' !== ( discountValue ?? '' )
					? { discounts: [ { type: discountType || 'FLAT', value: discountValue } ] }
					: {} ),
				...( shippingEnabled && hasShippingValue( activeShippingMode, shippingValue )
					? {
							shipping: [
								buildShipping( activeShippingMode, shippingValue, shippingAdditionalValue ),
							],
						}
					: {} ),
				// PayPal turns address collection on for a request that omits this, so it goes out
				// every time.
				collect_shipping_address: !! collectShippingAddress,
			},
		],
		...( returnUrl ? { return_url: returnUrl } : {} ),
	};
}
