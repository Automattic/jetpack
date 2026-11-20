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
import { formatPrice, ZERO_DECIMAL_CURRENCIES } from './currency-symbols';

const DECIMAL_PATTERN = /^(\d+\.?\d*|\.\d+)$/;

/**
 * A decimal string times `multiplier` over `divisor`, rounded half up to a whole number.
 *
 * Multiplies the string's digits as an integer, so 1.005 or 64.6% rounds the same as PayPal.
 *
 * @param {string} decimal    - A string DECIMAL_PATTERN matches.
 * @param {number} multiplier - What to multiply by.
 * @param {number} divisor    - What to divide by after.
 * @return {number} The rounded result.
 */
function roundDecimal( decimal, multiplier, divisor = 1 ) {
	const [ whole, fraction = '' ] = decimal.split( '.' );
	const digits = Number( whole + fraction );

	return Math.round( ( digits * multiplier ) / ( divisor * 10 ** fraction.length ) );
}

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
		return formatPrice( `${ price ?? '' }`.trim(), code );
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
 * A price less the link's discount, as text.
 *
 * Takes the discount as saved, the way PayPal's builder preview does, so the
 * result can be $0.00 or negative.
 *
 * @param {string}  value                - The price before the discount.
 * @param {object}  link                 - The link's block attributes.
 * @param {string}  link.currencyCode    - The ISO currency code.
 * @param {boolean} link.discountEnabled - Whether the discount is on.
 * @param {string}  link.discountType    - PERCENTAGE, or anything else for a flat amount.
 * @param {string}  link.discountValue   - The discount as entered.
 * @return {string} The formatted price, or an empty string when no discount applies.
 */
export function discountedPrice(
	value,
	{ currencyCode, discountEnabled, discountType, discountValue } = {}
) {
	const amount = `${ value ?? '' }`.trim();
	const discount = `${ discountValue ?? '' }`.trim();
	if (
		! discountEnabled ||
		! DECIMAL_PATTERN.test( amount ) ||
		! DECIMAL_PATTERN.test( discount )
	) {
		return '';
	}

	const code = currencyCode || 'USD';
	const decimals = ZERO_DECIMAL_CURRENCIES.has( code ) ? 0 : 2;
	const scale = 10 ** decimals;
	const cents = roundDecimal( amount, scale );
	// PayPal rounds the discount half up to the currency's smallest unit, then subtracts it.
	const off =
		discountType === 'PERCENTAGE'
			? roundDecimal( discount, cents, 100 )
			: roundDecimal( discount, scale );
	const result = cents - off;
	const formatted = formatPrice( ( Math.abs( result ) / scale ).toFixed( decimals ), code );

	return result < 0 ? `-${ formatted }` : formatted;
}

/**
 * The discount tag text, with the value as entered.
 *
 * @param {object} link               - The link's block attributes.
 * @param {string} link.currencyCode  - The ISO currency code.
 * @param {string} link.discountType  - PERCENTAGE, or anything else for a flat amount.
 * @param {string} link.discountValue - The discount as entered.
 * @return {string} "10% discount" or "$2.00 discount".
 */
export function discountLabel( { currencyCode, discountType, discountValue } = {} ) {
	const discount = `${ discountValue ?? '' }`.trim();

	return discountType === 'PERCENTAGE'
		? sprintf(
				/* translators: %s: discount percentage, e.g. "10" */
				__( '%s%% discount', 'jetpack-paypal-payments' ),
				discount
			)
		: sprintf(
				/* translators: %s: formatted discount amount, e.g. "$2.00" */
				__( '%s discount', 'jetpack-paypal-payments' ),
				formatPrice( discount, currencyCode || 'USD' )
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
