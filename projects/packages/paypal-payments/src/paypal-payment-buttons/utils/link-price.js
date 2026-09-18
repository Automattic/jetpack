/**
 * PayPal Payment Buttons — What a payment link charges.
 *
 * One rule for both sources: a block's own attributes, and a payment resource
 * from PayPal.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';
import { getLowestVariantPrice, hasVariantPricing } from '../components/variant-builder';
import { formatPrice } from './currency-symbols';

/**
 * The price a link charges, as text.
 *
 * A link priced per option shows the cheapest option price, as "From $29.99".
 *
 * @param {object}  link                 - The link's block attributes.
 * @param {string}  link.price           - The product price.
 * @param {string}  link.currencyCode    - The ISO currency code.
 * @param {boolean} link.variantsEnabled - Whether product options are on.
 * @param {object}  link.variants        - The option groups.
 * @return {string} The formatted price, or an empty string when there is none.
 */
export function linkPrice( { price, currencyCode, variantsEnabled, variants } = {} ) {
	const code = currencyCode || 'USD';

	if ( ! hasVariantPricing( variantsEnabled, variants ) ) {
		return `${ price ?? '' }`.trim() === '' ? '' : formatPrice( `${ price }`.trim(), code );
	}

	const lowest = getLowestVariantPrice( variants );
	if ( lowest === null ) {
		return '';
	}

	return sprintf(
		/* translators: %s: formatted price, e.g. "$29.99" */
		__( 'From %s', 'jetpack-paypal-payments' ),
		formatPrice( lowest, code )
	);
}

/**
 * The same price, read off a payment resource from the list route.
 *
 * A resource marks its primary group with the same `primary` flag the block
 * does, so this maps its fields onto linkPrice(). A link priced per option
 * keeps its currency on the options.
 *
 * @param {object} resource - A payment resource.
 * @return {string} The formatted price, or an empty string when the link has none.
 */
export function resourcePrice( resource ) {
	const item = resource?.line_items?.[ 0 ];
	if ( ! item ) {
		return '';
	}

	const dimensions = item.variants?.dimensions || [];
	const pricedOption = dimensions
		.find( dim => dim.primary )
		?.options?.find( opt => `${ opt.unit_amount?.value ?? '' }`.trim() !== '' );

	return linkPrice( {
		price: item.unit_amount?.value ?? '',
		currencyCode: item.unit_amount?.currency_code || pricedOption?.unit_amount?.currency_code,
		variantsEnabled: dimensions.length > 0,
		variants: item.variants,
	} );
}
