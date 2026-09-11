/**
 * Keep each PayPal block's payment in step with the post it sits in.
 *
 * The payment is created or updated when the post is saved, and deleted when
 * the post is saved without the block that held it.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';
import metadata from '../block.json';
import {
	hasVariantPricing,
	isVariantPricingOn,
	validateVariants,
} from '../components/variant-builder';
import { API_BASE } from './api-base';
import { buildRequestData, keepPayPalOnlyFields } from './request-data';
import { ADVISORY_ERROR_KEYS, getUserFriendlyError, getValidationErrors } from './validation';

// The last body each block sent, so an unchanged block is not re-sent on every save.
const lastSynced = new Map();

/**
 * Forget what has been synced. Tests start clean with this.
 */
export function forgetSyncedRequests() {
	lastSynced.clear();
}

/**
 * Why a block's form cannot be sent to PayPal yet, if it cannot.
 *
 * The same gate the editor shows the merchant: a blocking field error, or an
 * option group error, holds the payment back.
 *
 * @param {object} attributes - Block attributes.
 * @return {string|null} The first thing to fix, or null when the payment can go.
 */
export function heldBackReason( attributes ) {
	const {
		productName,
		price,
		productDescription,
		returnUrl,
		currencyCode,
		variantsEnabled,
		variants,
		taxEnabled,
		taxType,
		taxValue,
	} = attributes;

	const errors = getValidationErrors( {
		productName,
		price,
		productDescription,
		returnUrl,
		currencyCode,
		variantPricingOn: isVariantPricingOn( variantsEnabled, variants ),
		taxEnabled,
		taxIsPercentage: ( taxType || 'PERCENTAGE' ) === 'PERCENTAGE',
		taxValue,
	} );

	const blocking = Object.entries( errors ).find(
		( [ field, message ] ) => message && ! ADVISORY_ERROR_KEYS.includes( field )
	);
	if ( blocking ) {
		return blocking[ 1 ];
	}

	const [ variantError ] = validateVariants( variantsEnabled, variants, currencyCode || 'USD' );

	return variantError ? variantError.message : null;
}

/**
 * Whether a block's form is complete enough to send to PayPal.
 *
 * @param {object} attributes - Block attributes.
 * @return {boolean} True when the payment can be created or updated.
 */
export function isReadyForPayPal( attributes ) {
	return heldBackReason( attributes ) === null;
}

/**
 * Whether an API error says the payment no longer exists at PayPal.
 *
 * @param {object} err - The apiFetch error.
 * @return {boolean} True for a 404.
 */
function isNotFound( err ) {
	return err?.code === 'paypal_api_resource_not_found' || err?.data?.status === 404;
}

/**
 * Create a payment and return the attributes that point the block at it.
 *
 * @param {Function} request - apiFetch or a stand-in.
 * @param {object}   body    - The request body.
 * @return {Promise<object>} Attributes to set on the block.
 */
async function createPayment( request, body ) {
	const response = await request( { path: `${ API_BASE }/buttons`, method: 'POST', data: body } );

	return { isApiManaged: true, resourceId: response.id, paymentLink: response.payment_link };
}

/**
 * Create or update the payment behind one block.
 *
 * @param {object}   block                      - The block to sync.
 * @param {string}   block.clientId             - The block's client id.
 * @param {object}   block.attributes           - The block's attributes.
 * @param {object}   deps                       - Collaborators.
 * @param {Function} deps.request               - apiFetch or a stand-in.
 * @param {Function} deps.updateBlockAttributes - Writes attributes onto a block by clientId.
 * @param {Function} deps.reportError           - Shows the merchant a message.
 * @param {Function} deps.reportHeldBack        - Tells the merchant a block was not sent, and why.
 * @return {Promise<boolean>} True when the block's attributes changed.
 */
async function syncBlock(
	{ clientId, attributes },
	{ request, updateBlockAttributes, reportError, reportHeldBack }
) {
	const reason = heldBackReason( attributes );
	if ( reason ) {
		reportHeldBack?.( { clientId, attributes }, reason );
		return false;
	}

	const body = buildRequestData(
		attributes,
		hasVariantPricing( attributes.variantsEnabled, attributes.variants )
	);
	const key = JSON.stringify( body );
	const { resourceId } = attributes;

	if ( resourceId && lastSynced.get( clientId ) === key ) {
		return false;
	}

	let changed = false;
	try {
		if ( resourceId ) {
			try {
				// Read first: a PUT is a full replacement, and the payment carries
				// fields the form has no control for.
				const resource = await request( { path: `${ API_BASE }/buttons/${ resourceId }` } );
				await request( {
					path: `${ API_BASE }/buttons/${ resourceId }`,
					method: 'PUT',
					data: keepPayPalOnlyFields( body, resource ),
				} );
			} catch ( err ) {
				if ( ! isNotFound( err ) ) {
					throw err;
				}
				// Gone from PayPal, or deleted from the admin page: give the block a new one.
				updateBlockAttributes( clientId, await createPayment( request, body ) );
				changed = true;
			}
		} else {
			updateBlockAttributes( clientId, await createPayment( request, body ) );
			changed = true;
		}
		lastSynced.set( clientId, key );
	} catch ( err ) {
		reportError(
			sprintf(
				/* translators: 1: product name, 2: error message */
				__( 'PayPal did not save "%1$s": %2$s', 'jetpack-paypal-payments' ),
				attributes.productName,
				getUserFriendlyError( err )
			)
		);
	}

	return changed;
}

/**
 * Create or update the payment behind every PayPal block before the post is saved.
 *
 * @param {Array}  blocks - Blocks with clientId and attributes.
 * @param {object} deps   - See syncBlock().
 * @return {Promise<boolean>} True when any block's attributes changed.
 */
export async function syncBlocksBeforeSave( blocks, deps ) {
	const results = await Promise.all( blocks.map( block => syncBlock( block, deps ) ) );

	return results.some( Boolean );
}

const RESOURCE_ID_PATTERN = new RegExp(
	'wp:' + metadata.name.replace( '/', '\\/' ) + ' [^\\n]*?"resourceId":"(PLB-[A-Za-z0-9]+)"',
	'g'
);

/**
 * The payments the PayPal blocks in some post content point at.
 *
 * @param {string} content - Serialized post content.
 * @return {Set<string>} Resource ids.
 */
export function resourceIdsIn( content ) {
	const ids = new Set();
	for ( const match of String( content || '' ).matchAll( RESOURCE_ID_PATTERN ) ) {
		ids.add( match[ 1 ] );
	}

	return ids;
}

/**
 * The payments the saved post had that the content about to be saved no longer has.
 *
 * @param {string} savedContent - Content of the post as last saved.
 * @param {string} nextContent  - Content about to be saved.
 * @return {string[]} Resource ids the merchant removed.
 */
export function removedResourceIds( savedContent, nextContent ) {
	const next = resourceIdsIn( nextContent );

	return [ ...resourceIdsIn( savedContent ) ].filter( id => ! next.has( id ) );
}

/**
 * Delete the payments behind blocks the merchant removed, unless another
 * published post still uses them. The server does that check.
 *
 * @param {string[]} resourceIds  - Payments to delete.
 * @param {number}   postId       - The post being saved, left out of the check.
 * @param {object}   deps         - Collaborators.
 * @param {Function} deps.request - apiFetch or a stand-in.
 * @return {Promise<void>} Resolves once every delete has been attempted.
 */
export async function deleteRemovedPayments( resourceIds, postId, { request } ) {
	await Promise.all(
		resourceIds.map( id =>
			request( {
				path: `${ API_BASE }/buttons/${ id }?unused_only=1&post_id=${ Number( postId ) || 0 }`,
				method: 'DELETE',
				// The admin page lists what is left, so a failed delete is not worth a notice.
			} ).catch( () => {} )
		)
	);
}
