/**
 * Build the body of a PayPal payment from a block's attributes.
 *
 * @package
 */

import { withCurrency } from './resource-sync';

/**
 * Line-item fields set outside the block form.
 *
 * A PUT is a full replacement, so a field the request leaves out is one the
 * merchant deletes by pressing Update. These ride back out from the payment itself.
 */
export const PAYPAL_ONLY_LINE_ITEM_FIELDS = [ 'shipping', 'collect_shipping_address' ];

/**
 * Put the fields set outside the form back into an update request.
 *
 * @param {object} data     - The request built from the block's attributes.
 * @param {object} resource - The payment as it currently stands at PayPal.
 * @return {object} The request with those fields copied in.
 */
export function keepPayPalOnlyFields( data, resource ) {
	const stored = resource?.line_items?.[ 0 ];
	if ( ! stored ) {
		return data;
	}

	const kept = {};
	PAYPAL_ONLY_LINE_ITEM_FIELDS.forEach( key => {
		if ( stored[ key ] !== undefined && stored[ key ] !== null ) {
			kept[ key ] = stored[ key ];
		}
	} );

	// PayPal's stored value wins: for these the form only ever sends its own
	// defaults.
	return { ...data, line_items: [ { ...data.line_items[ 0 ], ...kept } ] };
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
				// Omitting this makes PayPal collect an address whatever the
				// payment said before, so it goes out on every request. On an
				// update the payment's own value replaces this one.
				collect_shipping_address: !! collectShippingAddress,
			},
		],
		...( returnUrl ? { return_url: returnUrl } : {} ),
	};
}
