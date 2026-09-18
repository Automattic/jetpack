/**
 * Line a block's attributes up with the PayPal payment it points at.
 *
 * Two blocks can share one payment — a duplicate, or one product shown as a
 * button, a link and a QR code — and only the block that saved last has seen
 * what PayPal holds.
 *
 * @package
 */

import metadata from '../block.json';

/**
 * Attributes the PayPal payment is the source of truth for. Everything else
 * (image, format, colors, button text) belongs to the block. The image is sent
 * to PayPal but never read back: its attachment id has no PayPal counterpart,
 * and PayPal silently drops an image it cannot fetch.
 */
export const RESOURCE_ATTRIBUTES = [
	'paymentLink',
	// The payment's own integration_mode, so a LINK or QR block re-sends what the
	// payment already has rather than downgrading a stacked payment back to LINK.
	'integrationMode',
	// The PayPal SDK URL, which only a BUTTON-mode payment carries. Shared with the
	// legacy paste-code path, which is safe only because the read-back GET is gated
	// on resourceId AND isApiManaged, and no legacy block has either.
	'scriptSrc',
	'productName',
	'price',
	'currencyCode',
	'productDescription',
	'productId',
	'variantsEnabled',
	'variants',
	'adjustableQuantity',
	'maxQuantity',
	'customerNotes',
	'taxEnabled',
	'taxType',
	'taxName',
	'taxValue',
	'handlingEnabled',
	'handlingValue',
	'discountEnabled',
	'discountType',
	'discountValue',
	'shippingEnabled',
	'shippingMode',
	'shippingValue',
	'shippingAdditionalValue',
	'collectShippingAddress',
	'returnUrl',
];

/**
 * Attributes each gating control owns, keyed by the attribute that gates them.
 *
 * A gate switched off drops its feature from the request, so everything it owns goes
 * back to its block.json default in the same `setAttributes` call, before the next
 * read-back overwrites it silently.
 */
export const GATED_ATTRIBUTES = {
	variantsEnabled: [ 'variants' ],
	adjustableQuantity: [ 'maxQuantity' ],
	taxEnabled: [ 'taxType', 'taxName', 'taxValue' ],
	handlingEnabled: [ 'handlingValue' ],
	discountEnabled: [ 'discountType', 'discountValue' ],
	shippingEnabled: [ 'shippingMode', 'shippingValue', 'shippingAdditionalValue' ],
};

/**
 * Block.json's defaults for the attributes named, as a setAttributes payload.
 *
 * Reading the metadata keeps block.json the one copy of every default.
 *
 * @param {...string} keys - Attribute names.
 * @return {object} Each attribute at its default.
 */
export function resetToDefaults( ...keys ) {
	return Object.fromEntries( keys.map( key => [ key, metadata.attributes[ key ]?.default ] ) );
}

/**
 * The payload a gate's control writes when it is switched off.
 *
 * @param {string} gate - The gating attribute, a key of GATED_ATTRIBUTES.
 * @return {object} The gate and everything it owns, at their defaults.
 */
export function turnGateOff( gate ) {
	return resetToDefaults( gate, ...GATED_ATTRIBUTES[ gate ] );
}

let nextKey = 1;

/**
 * Reduce a variants structure to what PayPal prices, so two copies compare on content.
 *
 * Editor-only `_key`s, the per-option currency and empty amounts are left out.
 *
 * @param {object} variants - Variants data with dimensions.
 * @return {Array|null} Comparable dimensions, or null when there are none.
 */
function comparableVariants( variants ) {
	const dimensions = variants?.dimensions;
	if ( ! Array.isArray( dimensions ) || dimensions.length === 0 ) {
		return null;
	}

	return dimensions.map( dim => ( {
		name: dim.name ?? '',
		primary: !! dim.primary,
		options: ( dim.options || [] ).map( opt => ( {
			label: opt.label ?? '',
			value: `${ opt.unit_amount?.value ?? '' }`.trim(),
		} ) ),
	} ) );
}

/**
 * Put a payment's variants into the shape the variant builder edits.
 *
 * Adds the `_key`s the builder uses for React keys, and infers `primary` from
 * where the prices are when the payment does not carry the flag. `primary` is
 * what the form reads for "per-variant pricing is on", so a payment with no
 * prices at all leaves every group unflagged rather than guessing at the first.
 *
 * @param {object} variants - Variants data from the payment.
 * @return {object|null} Editable variants, or null when there are none.
 */
export function normalizeResourceVariants( variants ) {
	const dimensions = variants?.dimensions;
	if ( ! Array.isArray( dimensions ) || dimensions.length === 0 ) {
		return null;
	}

	const hasPrimaryFlag = dimensions.some( dim => dim.primary );
	const pricedIndex = dimensions.findIndex( dim =>
		( dim.options || [] ).some( opt => `${ opt.unit_amount?.value ?? '' }`.trim() !== '' )
	);

	return {
		dimensions: dimensions.map( ( dim, i ) => ( {
			...dim,
			_key: dim._key || `rs-${ nextKey++ }`,
			primary: hasPrimaryFlag ? !! dim.primary : pricedIndex === i,
			options: ( dim.options || [] ).map( opt => ( {
				...opt,
				_key: opt._key || `rs-${ nextKey++ }`,
			} ) ),
		} ) ),
	};
}

/**
 * Retag every option price with the product's currency.
 *
 * An option carries its own `currency_code`, written when the price was typed.
 * Changing the product currency afterwards does not rewrite them, so a group
 * priced in USD and then switched to EUR would ship as USD.
 *
 * @param {object} variants     - The variants data.
 * @param {string} currencyCode - Product currency.
 * @return {object} Variants with every priced option in that currency.
 */
export function withCurrency( variants, currencyCode ) {
	if ( ! variants?.dimensions?.length ) {
		return variants;
	}

	return {
		...variants,
		dimensions: variants.dimensions.map( dim => ( {
			...dim,
			options: ( dim.options || [] ).map( opt =>
				opt.unit_amount
					? { ...opt, unit_amount: { ...opt.unit_amount, currency_code: currencyCode } }
					: opt
			),
		} ) ),
	};
}

/**
 * Whether two attribute values mean the same thing.
 *
 * @param {string} key - Attribute name.
 * @param {*}      a   - Current value.
 * @param {*}      b   - Value from the payment.
 * @return {boolean} True when both values mean the same thing.
 */
export function isSameValue( key, a, b ) {
	if ( key === 'variants' ) {
		return JSON.stringify( comparableVariants( a ) ) === JSON.stringify( comparableVariants( b ) );
	}
	if ( typeof a === 'object' || typeof b === 'object' ) {
		return JSON.stringify( a ?? null ) === JSON.stringify( b ?? null );
	}
	return a === b;
}

/**
 * Work out which block attributes differ from the payment PayPal holds.
 *
 * A field the payment no longer carries goes back to its block.json default,
 * so a description or a per-option price removed elsewhere clears here too.
 *
 * @param {object} current      - The block's current attributes.
 * @param {object} fromResource - Attributes mapped from the payment by the server.
 * @return {object} The attributes to set, empty when the block already agrees.
 */
export function getResourceAttributeUpdates( current, fromResource ) {
	const updates = {};

	RESOURCE_ATTRIBUTES.forEach( key => {
		const fallback = metadata.attributes[ key ]?.default;
		const value = current?.[ key ] === undefined ? fallback : current[ key ];

		let next = fromResource?.[ key ] === undefined ? fallback : fromResource[ key ];
		if ( key === 'variants' ) {
			next = normalizeResourceVariants( next );
		}

		if ( ! isSameValue( key, value, next ) ) {
			updates[ key ] = next;
		}
	} );

	return updates;
}
