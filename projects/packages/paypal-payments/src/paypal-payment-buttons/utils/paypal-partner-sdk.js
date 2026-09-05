/**
 * PayPal Payment Buttons — PayPal's onboarding SDK contract.
 *
 * @package
 */

/**
 * PayPal's onboarding SDK, per environment.
 */
const PARTNER_JS_URLS = {
	production: 'https://www.paypal.com/webapps/merchantboarding/js/lib/lightbox/partner.js',
	sandbox: 'https://www.sandbox.paypal.com/webapps/merchantboarding/js/lib/lightbox/partner.js',
};

/**
 * How long to give PayPal's SDK to bind the anchor before giving up.
 */
const ANCHOR_BINDING_TIMEOUT_MS = 10000;

/**
 * Name of the global PayPal invokes when onboarding completes.
 *
 * The SDK resolves it by name off the window it runs in, so it cannot be a
 * closure handed to the script.
 */
export const ONBOARD_CALLBACK_NAME = 'jetpackPayPalOnboardComplete';

/**
 * Sandbox flags for the frame PayPal's lightbox opens in.
 *
 * `allow-top-navigation` is deliberately absent: without it the browser blocks
 * the SDK's redirect to the return URL, which would otherwise reload the editor.
 */
export const ONBOARDING_SANDBOX =
	'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox';

/**
 * The document the SDK is loaded into, before the connect link is added.
 *
 * Transparent, because PayPal's lightbox paints its own backdrop over the
 * editor and a white sheet would sit in front of it until then.
 */
export const ONBOARDING_FRAME_SHELL = [
	'<!DOCTYPE html><html><head><meta charset="utf-8"><style>',
	'html,body{margin:0;height:100%;background:transparent;',
	'font-family:system-ui,sans-serif}',
	'#link{display:flex;align-items:center;justify-content:center;height:100%}',
	'#link a{padding:12px 28px;border-radius:24px;background:#ffc439;',
	'color:#003087;font-weight:600;text-decoration:none}',
	'</style></head><body><div id="link"></div></body></html>',
].join( '' );

/**
 * Load PayPal's onboarding SDK into a document, reusing the tag if it is there.
 *
 * @param {string}   environment - 'sandbox' or 'production'.
 * @param {Document} doc         - The document the connect link belongs to.
 * @return {Promise} Resolves once the SDK is ready.
 */
export function loadPartnerScript( environment, doc ) {
	const src = PARTNER_JS_URLS[ environment ] || PARTNER_JS_URLS.production;
	const existing = doc.querySelector( `script[data-paypal-partner-js="${ src }"]` );

	if ( existing ) {
		return existing.dataset.loaded === 'true'
			? Promise.resolve()
			: new Promise( ( resolve, reject ) => {
					existing.addEventListener( 'load', resolve );
					existing.addEventListener( 'error', reject );
			  } );
	}

	return new Promise( ( resolve, reject ) => {
		const script = doc.createElement( 'script' );
		script.src = src;
		script.async = true;
		// PayPal's own snippets give the tag this id; some SDK builds look
		// themselves up by it.
		script.id = 'paypal-js';
		script.dataset.paypalPartnerJs = src;
		script.addEventListener( 'load', () => {
			script.dataset.loaded = 'true';
			resolve();
		} );
		script.addEventListener( 'error', () =>
			reject( new Error( 'PayPal onboarding script failed to load.' ) )
		);
		doc.body.appendChild( script );
	} );
}

/**
 * Wait for PayPal's SDK to finish binding the connect anchor.
 *
 * render() returns before the anchor is bound. Until it finishes, the anchor is
 * an ordinary link and clicking it opens a browser tab. PayPal marks it done by
 * taking the target attribute away, so that is what to watch for.
 *
 * @param {HTMLAnchorElement} link  - The anchor PayPal is binding.
 * @param {Window}            realm - The window the anchor lives in.
 * @return {{promise: Promise, cancel: Function}} Resolves once bound, rejects on timeout.
 */
export function waitForAnchorBinding( link, realm ) {
	let settle;

	const promise = new Promise( ( resolve, reject ) => {
		if ( ! link.hasAttribute( 'target' ) ) {
			resolve();
			return;
		}

		const observer = new realm.MutationObserver( () => {
			if ( ! link.hasAttribute( 'target' ) ) {
				settle();
				resolve();
			}
		} );
		const timer = realm.setTimeout( () => {
			settle();
			reject( new Error( 'PayPal did not bind the onboarding link.' ) );
		}, ANCHOR_BINDING_TIMEOUT_MS );

		settle = () => {
			observer.disconnect();
			realm.clearTimeout( timer );
		};

		observer.observe( link, { attributes: true, attributeFilter: [ 'target' ] } );
	} );

	// The frame can be torn down mid-wait, leaving the timer running against a
	// dead frame for the full timeout.
	return { promise, cancel: () => settle?.() };
}
