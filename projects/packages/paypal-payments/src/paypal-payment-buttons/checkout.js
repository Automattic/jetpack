/**
 * PayPal Payment Buttons — on-site checkout script.
 *
 * Boots PayPal's buttons inside each checkout-format block. The order is created
 * and captured through the site's own REST routes, which price it from the payment
 * link, so nothing the page sends becomes an amount.
 *
 * @package
 */

// The SDK is loaded under this namespace, see PayPal_Payment_Buttons::tag_paypal_sdk_script().
const SDK_NAMESPACE = 'paypal_inline_checkout';

const CONTAINER_SELECTOR = '.jetpack-paypal-button__inline-checkout';
const BLOCK_SELECTOR = '.jetpack-paypal-button';
const MESSAGE_SELECTOR = '.jetpack-paypal-button__checkout-message';
const QUANTITY_SELECTOR = '.jetpack-paypal-button__quantity-input';
const VARIANT_SELECTOR = '.jetpack-paypal-button__variant-select';

/**
 * The PayPal SDK, under our namespace or PayPal's default.
 *
 * @return {object|undefined} The SDK.
 */
function getSdk() {
	return window[ SDK_NAMESPACE ] || window.paypal;
}

/**
 * POST JSON to one of the site's checkout routes.
 *
 * @param {string} url  - The route.
 * @param {object} body - The JSON body.
 * @return {Promise<object>} The decoded response.
 * @throws {Error} With the route's message and `code` on a non-2xx answer.
 */
export async function post( url, body ) {
	const response = await fetch( url, {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify( body ),
	} );
	const data = await response.json().catch( () => ( {} ) );

	if ( ! response.ok ) {
		const error = new Error( data?.message || 'request_failed' );
		error.code = data?.code || 'request_failed';
		throw error;
	}

	return data;
}

/**
 * The chosen option per option group.
 *
 * @param {Element} block - The block's card.
 * @return {object} Dimension name to option label.
 */
export function readSelection( block ) {
	const selection = {};
	block.querySelectorAll( VARIANT_SELECTOR ).forEach( select => {
		selection[ select.dataset.dimension ] = select.value;
	} );
	return selection;
}

/**
 * The quantity field's value, kept between 1 and the payment's maximum.
 *
 * @param {Element} block - The block's card.
 * @param {number}  max   - The most units one order may hold.
 * @return {number} The quantity.
 */
export function readQuantity( block, max ) {
	const input = block.querySelector( QUANTITY_SELECTOR );
	const value = parseInt( input?.value, 10 );

	if ( ! input || isNaN( value ) || value < 1 ) {
		return 1;
	}

	return Math.min( value, Math.max( 1, max ) );
}

/**
 * Show a line under the buttons, or hide it.
 *
 * @param {Element} block   - The block's card.
 * @param {string}  text    - The message, or '' to hide it.
 * @param {boolean} isError - Whether it reports a failure.
 */
function showMessage( block, text, isError = false ) {
	const message = block.querySelector( MESSAGE_SELECTOR );
	if ( ! message ) {
		return;
	}
	message.textContent = text;
	message.hidden = ! text;
	message.classList.toggle( 'is-error', isError );
}

/**
 * Draw PayPal's buttons into one checkout container.
 *
 * @param {Element} container - The container the render callback emitted.
 */
export function bootCheckout( container ) {
	const sdk = getSdk();
	const block = container.closest( BLOCK_SELECTOR ) || container.parentElement;
	const { resourceId, ordersUrl, successMessage, errorMessage } = container.dataset;
	const maxQuantity = parseInt( container.dataset.maxQuantity, 10 ) || 1;

	if ( ! sdk?.Buttons || ! resourceId || ! ordersUrl ) {
		return;
	}

	sdk
		.Buttons( {
			style: { layout: 'vertical', shape: 'rect' },
			createOrder: async () => {
				showMessage( block, '' );
				const order = await post( ordersUrl, {
					resource_id: resourceId,
					quantity: readQuantity( block, maxQuantity ),
					selection: readSelection( block ),
				} );
				if ( ! order?.id ) {
					throw new Error( 'server_error' );
				}
				return order.id;
			},
			onApprove: async data => {
				await post( `${ ordersUrl }/${ encodeURIComponent( data.orderID ) }/capture`, {} );
				block.classList.add( 'is-paid' );
				showMessage( block, successMessage );
			},
			onError: error => {
				// The route's own message says what to fix — the quantity, a missing
				// option. Anything else gets the generic line.
				showMessage( block, error?.code ? error.message : errorMessage, true );
			},
		} )
		.render( container );
}

/**
 * Boot every checkout container on the page.
 */
function init() {
	document.querySelectorAll( CONTAINER_SELECTOR ).forEach( bootCheckout );
}

if ( 'loading' === document.readyState ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
