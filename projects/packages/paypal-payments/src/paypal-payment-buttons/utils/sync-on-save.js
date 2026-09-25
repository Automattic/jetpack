/**
 * Keep each PayPal block's payment in step with the post it sits in.
 *
 * The payment is created or updated when the post is saved. Removing the block
 * leaves the payment alone.
 *
 * @package
 */

import { __, sprintf } from '@wordpress/i18n';
import {
	getComparisonPrice,
	hasVariantPricing,
	isVariantPricingOn,
	validateCustomerNotes,
	validateVariants,
} from '../components/variant-builder';
import { API_BASE } from './api-base';
import { addExistingLink, markExistingLinksDirty, removeExistingLink } from './existing-links';
import { buildRequestData } from './request-data';
import { getResourceAttributeUpdates } from './resource-sync';
import {
	firstBlockingError,
	getUserFriendlyError,
	getValidationErrors,
	isNotFound,
} from './validation';

// What each block's save asked for, so an unchanged block is not re-sent on every save.
// A create sends a shorter body, without the sibling mode or the read-back, and comes back
// with the mapped payment under an id no stacked block yet shares.
const lastSynced = new Map();

// The payment each block has read back, by id, since a block can later be pointed at
// a different one.
const paymentsRead = new Map();

// Blocks whose editor rendered, keyed by clientId. Both cases hold the save back, but
// only a block that rendered is told to reload; the rest are sent to the visual editor.
const blocksMounted = new Set();

// Each payment's last read, as block attributes, by payment id since blocks can share one.
// A save that writes the payment clears it.
const paymentsHeld = new Map();

// How many saves changed each payment. PayPal's SDK draws the stacked card once, so the
// preview remounts when this goes up.
const cardRevisions = new Map();

// PayPal grants the mode stacked needs per account, and only a write tells us — a GET
// reads the same either way. Without the capability there are no code_snippets and so
// no scriptSrc. Nothing records the refusal, so an account granted it later just works.
const STACKED_UNAVAILABLE = __(
	"Stacked buttons aren't available for this PayPal account yet. Please choose another format.",
	'jetpack-paypal-payments'
);

// The payment reached PayPal but the read-back did not, so the block has no SDK URL and
// nothing yet says whether the account can do stacked. Saving again asks again, and so
// does reloading the post.
const STACKED_UNCONFIRMED = __(
	'There was an issue saving your stacked buttons. Please try again.',
	'jetpack-paypal-payments'
);

/**
 * Forget what has been synced and what has been read. Tests start clean with this.
 */
export function forgetSyncedRequests() {
	lastSynced.clear();
	paymentsRead.clear();
	blocksMounted.clear();
	paymentsHeld.clear();
	cardRevisions.clear();
}

/**
 * How many saves have changed a payment.
 *
 * @param {string} resourceId - The payment.
 * @return {number} The count, starting at 0.
 */
export function getCardRevision( resourceId ) {
	return cardRevisions.get( resourceId ) || 0;
}

/**
 * Record that a block's editor rendered, which decides the message a held-back save shows.
 *
 * @param {string} clientId - The block's client id.
 */
export function recordBlockMounted( clientId ) {
	blocksMounted.add( clientId );
}

/**
 * Record that a block has read the payment it points at, so the save may write it.
 *
 * @param {string} clientId   - The block's client id.
 * @param {string} resourceId - The payment the block read.
 * @param {object} [held]     - The payment as block attributes.
 */
export function recordPaymentRead( clientId, resourceId, held ) {
	paymentsRead.set( clientId, resourceId );
	if ( held ) {
		paymentsHeld.set( resourceId, held );
	}
}

/**
 * Bump the card revision of each payment a PUT changed from its last read, and call
 * reportSaved for each payment a PUT changed. Without a read, a PUT is compared with
 * block.json's defaults, which a named product differs from.
 *
 * @param {Map}      written     - The attributes and mode each PUT wrote, by payment id.
 * @param {Function} reportSaved - Called once for each payment the PUTs changed.
 */
function recordPaymentsWritten( written, reportSaved ) {
	written.forEach( ( writes, resourceId ) => {
		const held = paymentsHeld.get( resourceId );
		// Blocks sharing a payment can PUT different values in any order, so the next save
		// needs a fresh read to compare with.
		paymentsHeld.delete( resourceId );

		const changed = writes.some(
			( { attributes } ) => Object.keys( getResourceAttributeUpdates( attributes, held ) ).length
		);
		if ( changed ) {
			cardRevisions.set( resourceId, getCardRevision( resourceId ) + 1 );
		}

		// The first save after a reload PUTs every ready block, so reportSaved is called for a PUT
		// that differs from the read, or has no read values. A switch to stacked sends BUTTON and
		// leaves integrationMode as it was, so the mode is compared as sent.
		if (
			! held ||
			changed ||
			writes.some( ( { mode } ) => mode !== ( held.integrationMode || 'LINK' ) )
		) {
			reportSaved?.( false );
		}
	} );
}

/**
 * Why a block's form cannot be sent to PayPal yet, if it cannot.
 *
 * The same check the editor shows the merchant - a field error, an option group
 * error or a customer note error.
 *
 * @param {object} attributes - Block attributes.
 * @return {string|null} The first thing to fix, or null when the payment can go.
 */
export function heldBackReason( attributes ) {
	const { price, currencyCode, variantsEnabled, variants, customerNotes } = attributes;

	const variantPricingOn = isVariantPricingOn( variantsEnabled, variants );

	// The whole attribute set goes in, so a new field is covered here and in the editor
	// at once.
	const errors = getValidationErrors( {
		...attributes,
		variantPricingOn,
		comparisonPrice: getComparisonPrice( variantPricingOn, variants, price ),
	} );

	const blocking = firstBlockingError( errors );
	if ( blocking ) {
		return blocking;
	}

	const [ variantError ] = validateVariants( variantsEnabled, variants, currencyCode || 'USD' );
	if ( variantError ) {
		return variantError.message;
	}

	const [ noteError ] = validateCustomerNotes( customerNotes );

	return noteError ? noteError.message : null;
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
 * Create a payment, and hand back both the response and the attributes that point
 * the block at it.
 *
 * @param {Function} request    - apiFetch or a stand-in.
 * @param {string}   clientId   - The block's client id.
 * @param {object}   attributes - The block's current attributes.
 * @param {object}   body       - The request body.
 * @return {Promise<object>} The API response, created: true, and the attributes to set on the block.
 */
async function createPayment( request, clientId, attributes, body ) {
	const response = await request( { path: `${ API_BASE }/buttons`, method: 'POST', data: body } );

	// This request is what PayPal now has, so the next save can update it without a read.
	recordPaymentRead( clientId, response.id, response.attributes );
	// PayPal answers with the whole resource, so every picker can offer it right away.
	addExistingLink( response );

	return {
		response,
		created: true,
		updates: {
			isApiManaged: true,
			resourceId: response.id,
			// What PayPal decided rather than echoed — the payment link, the SDK URL and the
			// settled mode. Otherwise a new stacked block saves an empty scriptSrc and keeps it:
			// the mount GET runs after the post is serialized.
			...resourceUpdatesFrom( attributes, response ),
		},
	};
}

/**
 * What a create or update response says should change on the block.
 *
 * The server attaches `attributes` only when it read the resource back: a PUT echo has
 * no `id`, and mapping one would blank the block's resourceId. Diffing runs through the
 * same helper as the mount read-back, so variants compare the same way and an unchanged
 * block comes back empty.
 *
 * @param {object} attributes - The block's current attributes.
 * @param {object} response   - The API response.
 * @return {object} Attributes to set, empty when there is nothing to change.
 */
function resourceUpdatesFrom( attributes, response ) {
	return response?.attributes ? getResourceAttributeUpdates( attributes, response.attributes ) : {};
}

/**
 * Tell the merchant when a stacked block's account cannot do stacked.
 *
 * The format is left alone — the message asks them to choose another.
 *
 * @param {object}   block       - The block, with clientId and attributes.
 * @param {string}   scriptSrc   - The SDK URL the block ends this save with.
 * @param {Function} reportError - Tells the merchant a block's save failed, and why.
 */
function reportStackedUnavailable( block, scriptSrc, reportError ) {
	if ( 'STACKED' === block.attributes.format && ! scriptSrc ) {
		reportError( block, STACKED_UNAVAILABLE );
	}
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
 * @param {Function} deps.reportError           - Tells the merchant a block's save failed, and why.
 * @param {Function} deps.reportHeldBack        - Tells the merchant a block was not sent, and why.
 * @param {Function} deps.reportSaved           - Called with true for a payment created, false for one changed.
 * @param {Set}      stackedResources           - Payments a stacked block in this save draws from.
 * @param {Map}      written                    - Collects the attributes and mode each PUT wrote, by payment id.
 * @return {Promise<boolean>} True when the block's attributes changed.
 */
async function syncBlock(
	{ clientId, attributes },
	{ request, updateBlockAttributes, reportError, reportHeldBack, reportSaved },
	stackedResources,
	written
) {
	const reason = heldBackReason( attributes );
	if ( reason ) {
		reportHeldBack?.( { clientId, attributes }, reason );
		return false;
	}

	const { resourceId } = attributes;

	// An unread block can be holding block.json defaults, and the PUT below would write
	// them over the payment PayPal has. A block with no payment yet has nothing to overwrite.
	if ( resourceId && paymentsRead.get( clientId ) !== resourceId ) {
		reportHeldBack?.(
			{ clientId, attributes },
			blocksMounted.has( clientId )
				? __(
						'Its current settings have not loaded yet. Reload the post and try again.',
						'jetpack-paypal-payments'
					)
				: __( 'Open this block in the visual editor and save again.', 'jetpack-paypal-payments' )
		);
		return false;
	}

	const ownBody = buildRequestData(
		attributes,
		hasVariantPricing( attributes.variantsEnabled, attributes.variants )
	);

	// Every block sharing a stacked block's payment sends BUTTON, so all of them keep it in the
	// mode stacked needs. This is body-only: a link or QR sibling skips the read-back, so the
	// save writes nothing onto it. Its next mount GET picks up BUTTON and an SDK URL it never
	// renders, and it sends BUTTON from then on, which costs it nothing — a BUTTON-mode payment
	// keeps its payment_link.
	const sharedMode = stackedResources.has( resourceId ) ? { integration_mode: 'BUTTON' } : {};

	// PayPal answers a PUT with 204 and no code_snippets, so the server re-reads the payment when
	// asked. Only a stacked block renders the SDK, so only it pays for that read.
	const snippets = 'STACKED' === attributes.format ? { include_snippets: true } : {};

	// The read-back belongs in the key: a sibling switched to stacked sends the same fields it
	// sent as a link, and would otherwise count as unchanged and be left without its SDK URL.
	const body = { ...ownBody, ...sharedMode, ...snippets };
	const key = JSON.stringify( body );

	if ( resourceId && lastSynced.get( clientId ) === key ) {
		// Nothing was written, so nothing new is known — the block still lacks an SDK URL
		// and still renders the fallback, so say so again.
		reportStackedUnavailable( { clientId, attributes }, attributes.scriptSrc, reportError );
		return false;
	}

	let changed = false;
	try {
		let result;

		if ( resourceId ) {
			try {
				// A PUT replaces the payment outright, and the form models every line item field
				// PayPal stores, so the body goes out as built.
				const response = await request( {
					path: `${ API_BASE }/buttons/${ resourceId }`,
					method: 'PUT',
					data: body,
				} );
				// The pickers read the list again for the new name and price.
				markExistingLinksDirty();

				// Compared with what was read once every PUT has settled.
				written.set( resourceId, [
					...( written.get( resourceId ) || [] ),
					{ attributes, mode: body.integration_mode },
				] );

				// The read-back is how a block switching to stacked gets its scriptSrc in the same
				// save. Without one the response is the echo, which changes nothing.
				result = { response, created: false, updates: resourceUpdatesFrom( attributes, response ) };
			} catch ( err ) {
				if ( ! isNotFound( err ) ) {
					throw err;
				}
				// Gone from PayPal, or deleted from the admin page: give the block a new one, in
				// its own mode — a fresh payment is the block's alone, with no sibling to match.
				removeExistingLink( resourceId );
				result = await createPayment( request, clientId, attributes, ownBody );
			}
		} else {
			result = await createPayment( request, clientId, attributes, ownBody );
		}

		const { response, created, updates } = result;

		// recordPaymentsWritten() calls reportSaved for an update once every PUT has settled.
		if ( created ) {
			reportSaved?.( true );
		}

		if ( Object.keys( updates ).length > 0 ) {
			updateBlockAttributes( clientId, updates );
			changed = true;
		}
		// A stacked block learns what its account can do from the read-back, so a save
		// without one leaves the next save to ask again.
		if ( response?.attributes || 'STACKED' !== attributes.format ) {
			lastSynced.set( clientId, key );
		}

		if ( response?.attributes ) {
			reportStackedUnavailable(
				{ clientId, attributes },
				'scriptSrc' in updates ? updates.scriptSrc : attributes.scriptSrc,
				reportError
			);
		} else if ( 'STACKED' === attributes.format ) {
			// An echo with no resource says nothing about the account, so ask for a retry
			// instead of saying PayPal refused.
			reportError( { clientId, attributes }, STACKED_UNCONFIRMED );
		}
	} catch ( err ) {
		reportError(
			{ clientId, attributes },
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
	// The PUTs race, so a sibling sending LINK could finish last and take the payment out of
	// the mode stacked needs, with no later save to undo it — the stacked block's body is
	// unchanged, so its next save short-circuits.
	const stackedResources = new Set(
		blocks
			.filter( ( { attributes } ) => 'STACKED' === attributes.format && attributes.resourceId )
			.map( ( { attributes } ) => attributes.resourceId )
	);

	const written = new Map();
	const results = await Promise.all(
		blocks.map( block => syncBlock( block, deps, stackedResources, written ) )
	);

	// Once every PUT has settled, so a shared payment gets at most one card revision bump
	// and one reportSaved call.
	recordPaymentsWritten( written, deps.reportSaved );

	return results.some( Boolean );
}
