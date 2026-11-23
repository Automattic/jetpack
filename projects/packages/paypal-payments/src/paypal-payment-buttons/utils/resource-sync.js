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
import { imageFromResource } from './images';

/**
 * Attributes that come from PayPal, which the form leaves out.
 */
export const PAYPAL_SET_ATTRIBUTES = [
	'paymentLink',
	// The payment's own integration_mode, so a LINK or QR block re-sends it as it is.
	'integrationMode',
	// The PayPal SDK URL, which only a BUTTON-mode payment has. The legacy paste-code
	// path shares the attribute, and its blocks have neither resourceId nor isApiManaged,
	// so the read-back GET leaves them alone.
	'scriptSrc',
];

/**
 * Attributes the PayPal payment is the source of truth for. Everything else
 * (the legacy imageUrl, format, colors, button text) belongs to the block.
 */
export const RESOURCE_ATTRIBUTES = [
	...PAYPAL_SET_ATTRIBUTES,
	'productName',
	'price',
	'currencyCode',
	'productDescription',
	'productId',
	'images',
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
 * The payment the block points at and everything read from it. Reset together, so the
 * next save creates a new payment.
 */
export const PAYMENT_ATTRIBUTES = [ 'isApiManaged', 'resourceId', ...RESOURCE_ATTRIBUTES ];

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
 * Whether an option group has at least one priced option.
 *
 * @param {object} dim - The option group.
 * @return {boolean} True when an option carries an amount.
 */
function hasPricedOption( dim ) {
	return ( dim.options || [] ).some( opt => `${ opt.unit_amount?.value ?? '' }`.trim() !== '' );
}

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
			image: comparableImage( opt.images?.[ 0 ] ),
		} ) ),
	} ) );
}

/**
 * Reduce an image to what PayPal holds: which it is, and whether it is approved yet.
 *
 * @param {object} image - The image as the block stores it.
 * @return {string} The comparable form, '' for no image.
 */
function comparableImage( image ) {
	return image?.assetId ? `${ image.assetId }|${ image.status ?? '' }` : '';
}

/**
 * Reduce an images list to what PayPal holds, so two copies compare on content.
 *
 * The order matters: the first image is the primary one.
 *
 * @param {Array} images - The images attribute.
 * @return {string[]} The comparable images in order.
 */
function comparableImages( images ) {
	return ( Array.isArray( images ) ? images : [] ).map( comparableImage );
}

/**
 * What the media library knows about each image the block holds, by asset id.
 *
 * PayPal returns no name and no thumbnail for an image still in review, so the
 * block's own record of what it sent carries the row until then.
 *
 * @param {object} current - The block's current attributes.
 * @return {Map} attachmentId, name and thumbnailUrl per asset id.
 */
function localImageMeta( current ) {
	const meta = new Map();
	const note = image => {
		if ( image?.assetId && ( image.attachmentId || image.name ) ) {
			meta.set( image.assetId, {
				attachmentId: image.attachmentId,
				name: image.name,
				thumbnailUrl: image.thumbnailUrl,
			} );
		}
	};

	( current?.images || [] ).forEach( note );
	( current?.variants?.dimensions || [] ).forEach( dim =>
		( dim.options || [] ).forEach( opt => ( opt.images || [] ).forEach( note ) )
	);

	return meta;
}

/**
 * Lay the block's own record of each image over what PayPal returned for it.
 *
 * @param {Array} images - Images as read from the payment.
 * @param {Map}   meta   - From localImageMeta().
 * @return {Array} The images, named and with a thumbnail where the block had one.
 */
function withLocalImageMeta( images, meta ) {
	return ( images || [] ).map( image => {
		const local = meta.get( image.assetId );
		if ( ! local ) {
			return image;
		}
		return {
			...image,
			...( local.attachmentId ? { attachmentId: local.attachmentId } : {} ),
			...( local.name ? { name: local.name } : {} ),
			thumbnailUrl: local.thumbnailUrl || image.thumbnailUrl || '',
		};
	} );
}

/**
 * withLocalImageMeta() for the image on each variant option.
 *
 * @param {object|null} variants - Normalized variants.
 * @param {Map}         meta     - From localImageMeta().
 * @return {object|null} The variants.
 */
function withLocalOptionImageMeta( variants, meta ) {
	if ( ! variants?.dimensions ) {
		return variants;
	}

	return {
		...variants,
		dimensions: variants.dimensions.map( dim => ( {
			...dim,
			options: ( dim.options || [] ).map( opt =>
				opt.images ? { ...opt, images: withLocalImageMeta( opt.images, meta ) } : opt
			),
		} ) ),
	};
}

/**
 * Put a payment's variants into the shape the variant builder edits.
 *
 * Adds the `_key`s the builder uses for React keys. PayPal flags exactly one group
 * `primary` whether or not it is priced, but `primary` is what the form reads for
 * "per-variant pricing is on", so the flag is kept only on a group that carries a
 * price, and inferred from where the prices are when the payment has none. An
 * option's image comes back in PayPal's shape and is put into the block's.
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
	const pricedIndex = dimensions.findIndex( hasPricedOption );

	return {
		dimensions: dimensions.map( ( dim, i ) => ( {
			...dim,
			_key: dim._key || `rs-${ nextKey++ }`,
			primary: ( hasPrimaryFlag ? !! dim.primary : pricedIndex === i ) && hasPricedOption( dim ),
			options: ( dim.options || [] ).map( opt => ( {
				...opt,
				_key: opt._key || `rs-${ nextKey++ }`,
				...( Array.isArray( opt.images )
					? { images: opt.images.slice( 0, 1 ).map( imageFromResource ) }
					: {} ),
			} ) ),
		} ) ),
	};
}

/**
 * Flag the first option group primary when none is.
 *
 * PayPal rejects variants without exactly one primary group, while the form only
 * flags one once it carries prices. normalizeResourceVariants() drops the flag again.
 *
 * @param {object} variants - The variants data.
 * @return {object} Variants with one primary group.
 */
export function withPrimaryDimension( variants ) {
	if ( ! variants?.dimensions?.length || variants.dimensions.some( dim => dim.primary ) ) {
		return variants;
	}

	return {
		...variants,
		dimensions: variants.dimensions.map( ( dim, i ) => ( { ...dim, primary: i === 0 } ) ),
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
	if ( key === 'images' ) {
		return JSON.stringify( comparableImages( a ) ) === JSON.stringify( comparableImages( b ) );
	}
	if ( typeof a === 'object' || typeof b === 'object' ) {
		return JSON.stringify( a ?? null ) === JSON.stringify( b ?? null );
	}
	return a === b;
}

/**
 * Whether a read-back change is bookkeeping rather than something done at PayPal.
 *
 * `integrationMode` belongs to the payment: a sibling going stacked flips it, and the
 * merchant never sets or sees it. A first `scriptSrc` arriving is the same. One that
 * went empty means the payment lost BUTTON mode, which matters only to a stacked block,
 * so only a stacked block is told.
 *
 * @param {string} key    - Attribute name.
 * @param {*}      prior  - The block's value before the read-back.
 * @param {string} format - The block's display format.
 * @return {boolean} True when the change says nothing to the merchant.
 */
export function isBookkeeping( key, prior, format ) {
	if ( key === 'integrationMode' ) {
		return true;
	}
	if ( key !== 'scriptSrc' ) {
		return false;
	}
	if ( 'STACKED' !== format ) {
		return true;
	}

	const fallback = metadata.attributes.scriptSrc.default;

	return ( prior ?? fallback ) === fallback;
}

/**
 * Work out which block attributes differ from the payment PayPal holds.
 *
 * A field the payment no longer carries goes back to its block.json default,
 * so a description or a per-option price removed elsewhere clears here too. The
 * link is the exception: it is fixed to the payment's id, so a read with an empty
 * link keeps the block's. An image keeps the name and thumbnail the block has for it.
 *
 * @param {object} current      - The block's current attributes.
 * @param {object} fromResource - Attributes mapped from the payment by the server.
 * @return {object} The attributes to set, empty when the block already agrees.
 */
export function getResourceAttributeUpdates( current, fromResource ) {
	const updates = {};
	const imageMeta = localImageMeta( current );

	RESOURCE_ATTRIBUTES.forEach( key => {
		if ( key === 'paymentLink' && ! fromResource?.paymentLink ) {
			return;
		}

		const fallback = metadata.attributes[ key ]?.default;
		const value = current?.[ key ] === undefined ? fallback : current[ key ];

		let next = fromResource?.[ key ] === undefined ? fallback : fromResource[ key ];
		if ( key === 'variants' ) {
			next = withLocalOptionImageMeta( normalizeResourceVariants( next ), imageMeta );
		}
		if ( key === 'images' ) {
			next = withLocalImageMeta( next, imageMeta );
		}

		if ( ! isSameValue( key, value, next ) ) {
			updates[ key ] = next;
		}
	} );

	return updates;
}
