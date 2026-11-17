/*
 * A page whose feature was switched off since the menu was drawn: checked on every visit, and
 * replaced by a panel that turns it back on.
 */
import { log } from './debug';

// A stalled check fails open, like a failed one; turning a feature on can take a while longer.
const CHECK_TIMEOUT = 5000;
const TURN_ON_TIMEOUT = 30000;

const request = ( url, slug, gate, gateNonce, body ) => {
	const target = new URL( url, location.href );
	const params = new URLSearchParams( { member: slug, ...gate, gate_nonce: gateNonce ?? '' } );
	const signal = AbortSignal.timeout?.( body ? TURN_ON_TIMEOUT : CHECK_TIMEOUT );
	if ( body ) {
		params.set( 'activate', '1' );
		return fetch( target, { method: 'POST', credentials: 'same-origin', body: params, signal } );
	}
	params.forEach( ( value, key ) => target.searchParams.set( key, value ) );
	return fetch( target, { credentials: 'same-origin', signal } );
};

/**
 * Whether a page's feature is still on. Fails open, as the sidebar does.
 *
 * @param {string} url       - The feature endpoint.
 * @param {string} slug      - Page slug.
 * @param {object} gate      - The gate its menu item declared.
 * @param {string} gateNonce - The nonce that ties the gate to the page.
 * @return {Promise<{on: boolean, card: string}>} `on` is false only when the site says so; `card` is the HTML to show then.
 */
export async function checkFeature( url, slug, gate, gateNonce ) {
	try {
		const response = await request( url, slug, gate, gateNonce );
		const json = await response.json();
		log( 'feature', `${ slug }: ${ json?.data?.on === false ? 'off' : 'on' }`, json );
		return { on: json?.data?.on !== false, card: json?.data?.card || '' };
	} catch ( error ) {
		log( 'feature', `${ slug }: could not check, assuming on`, error );
		return { on: true, card: '' };
	}
}

/**
 * Show the panel that stands in for a page whose feature is off.
 *
 * @param {object}      options           - Options.
 * @param {HTMLElement} options.after     - Element the panel goes after.
 * @param {string}      options.slug      - Page slug.
 * @param {string}      options.title     - Feature name.
 * @param {object}      options.gate      - The gate its menu item declared.
 * @param {string}      options.gateNonce - The nonce that ties the gate to the page.
 * @param {string}      options.url       - The feature endpoint.
 * @param {object}      options.strings   - Translated copy, from the shell config.
 * @param {string}      options.card      - My Jetpack's card for the feature, the same one its page prints. Empty for the plain panel.
 * @return {HTMLElement} The panel, its heading focusable but not focused.
 */
export function showFeatureOff( { after, slug, title, gate, gateNonce, url, strings, card } ) {
	const panel = document.createElement( 'section' );
	panel.className = 'wrap jetpack-admin-shell-feature-off';
	panel.dataset.shellPage = slug;
	panel.dataset.shellState = 'off';
	// Jetpack pages drop wp-admin's content padding, which a plain `.wrap` relies on.
	panel.style.paddingInline = '22px';

	if ( card ) {
		// The site's own markup, from the same origin; its Turn on form posts and redirects back here.
		panel.innerHTML = card;
		after.after( panel );
		// innerHTML leaves scripts inert; a fresh copy runs, like it does on the card's own page.
		panel.querySelectorAll( 'script' ).forEach( inert => {
			const script = document.createElement( 'script' );
			script.textContent = inert.textContent;
			inert.replaceWith( script );
		} );
		panel.querySelector( 'h1' )?.setAttribute( 'tabindex', '-1' );
		log( 'feature', `${ slug }: showing the site's turned-off card` );
		return panel;
	}

	const heading = document.createElement( 'h1' );
	heading.textContent = strings.heading.replace( '%s', title );
	heading.tabIndex = -1;
	const text = document.createElement( 'p' );
	text.textContent = strings.text;
	const button = document.createElement( 'button' );
	button.type = 'button';
	button.className = 'button button-primary';
	button.textContent = strings.button.replace( '%s', title );
	const error = document.createElement( 'p' );
	error.setAttribute( 'role', 'alert' );
	const form = document.createElement( 'p' );
	form.append( button );

	button.addEventListener( 'click', async () => {
		button.disabled = true;
		button.textContent = strings.busy;
		error.textContent = '';
		try {
			const json = await ( await request( url, slug, gate, gateNonce, true ) ).json();
			if ( json?.success && json.data?.on ) {
				// A page load brings the menu item back and boots the page with its feature on.
				location.reload();
				return;
			}
			error.textContent = json?.data?.message || strings.failed;
		} catch {
			error.textContent = strings.failed;
		}
		button.disabled = false;
		button.textContent = strings.button.replace( '%s', title );
	} );

	panel.append( heading, error, text, form );
	after.after( panel );
	log( 'feature', `${ slug }: showing the turned-off panel` );
	return panel;
}
