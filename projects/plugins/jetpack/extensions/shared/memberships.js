/* global tb_show, tb_remove */

let subscriptionsJWTTokenForCookie = '';

function setUpThickbox( button ) {
	button.addEventListener( 'click', event => {
		event.preventDefault();
		const url = button.getAttribute( 'href' );
		window.scrollTo( 0, 0 );
		tb_show( null, url + '&display=alternate&TB_iframe=true', null );
		window.addEventListener( 'message', handleIframeResult, false );
		const tbWindow = document.querySelector( '#TB_window' );
		tbWindow.classList.add( 'jetpack-memberships-modal' );

		// This line has to come after the Thickbox has opened otherwise Firefox doesn't scroll to the top.
		window.scrollTo( 0, 0 );
	} );
}

export const initializeMembershipButtons = selector => {
	const membershipButtons = Array.prototype.slice.call( document.querySelectorAll( selector ) );
	membershipButtons.forEach( button => {
		if ( button.getAttribute( 'data-jetpack-memberships-button-initialized' ) === 'true' ) {
			return;
		}

		try {
			setUpThickbox( button );
		} catch ( err ) {
			// eslint-disable-next-line no-console
			console.error( 'Problem setting up Thickbox', err );
		}

		button.setAttribute( 'data-jetpack-memberships-button-initialized', 'true' );
	} );
};

const tokenCookieName = 'jp-premium-content-session';
const getTokenFromCookie = function () {
	const value = `; ${ document.cookie }`;
	const parts = value.split( `; ${ tokenCookieName } = ` );
	if ( parts.length === 2 ) {
		return parts.pop().split( ';' ).shift();
	}
};

const setTokenCookie = function ( token ) {
	// We will set this in a cookie  - just in case. This will be reloaded in the refresh, when user clicks OK.
	// But user can close the browser window before clicking OK. IN that case, we want to leave a cookie behind.
	const date = new Date();
	// We set the cookie for one week: subscription can be cancelled and we don't want the user to keep access
	date.setTime( date.getTime() + 7 * 24 * 60 * 60 * 1000 );
	document.cookie =
		'jp-premium-content-session' + '=' + token + '; expires=' + date.toGMTString() + '; path=/';
};

export function show_modal( data ) {
	const params = new URLSearchParams( data );

	const url = 'https://subscribe.wordpress.com/memberships/?' + params.toString();

	window.scrollTo( 0, 0 );
	tb_show( null, url + '&TB_iframe=true', null );

	window.addEventListener( 'message', handleIframeResult, false );
	const tbWindow = document.querySelector( '#TB_window' );
	tbWindow.classList.add( 'jetpack-memberships-modal' );

	// This line has to come after the Thickbox has opened otherwise Firefox doesnt scroll to the top.
	window.scrollTo( 0, 0 );
}

export function show_modal_retrieve_subscriptions_from_email( blog, email ) {
	// Email does not have to be
	show_modal( {
		email: email ?? '',
		blog,
		plan: 'newsletter',
		source: 'jetpack_retrieve_subscriptions',
	} );
}

/**
 * @typedef globalThis
 * @param {globalThis.Event} eventFromIframe - message event that gets emitted in the checkout iframe.
 * @listens window#message
 */
export function handleIframeResult( eventFromIframe ) {
	if ( eventFromIframe.origin === 'https://subscribe.wordpress.com' && eventFromIframe.data ) {
		const data = JSON.parse( eventFromIframe.data );
		if ( data && data.result && data.result.jwt_token ) {
			// We save the token for now, doing nothing.
			subscriptionsJWTTokenForCookie = data.result.jwt_token;
			setTokenCookie( subscriptionsJWTTokenForCookie );
		}
		if ( data && data.action === 'close' && getTokenFromCookie() ) {
			// The token was set during the purchase flow, we want to reload the whole page so the content is displayed
			window.location.reload();
		} else if ( data && data.action === 'close' ) {
			// User just aborted.
			window.removeEventListener( 'message', handleIframeResult );
			tb_remove && tb_remove();
		}
	}
}
