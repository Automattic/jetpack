let premiumContentJWTTokenForCookie = '';

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
			premiumContentJWTTokenForCookie = data.result.jwt_token;
			setPurchaseResultCookie( premiumContentJWTTokenForCookie );
		}
		if ( data && data.action === 'close' && premiumContentJWTTokenForCookie ) {
			// The token was set during the purchase flow, we want to reload the whole page so the content is displayed
			window.location.reload();
		} else if ( data && data.action === 'close' ) {
			// User just aborted.
			window.removeEventListener( 'message', handleIframeResult );
			const dialog = document.getElementById( 'memberships-modal-window' );
			dialog.close();
			dialog.remove();
			document.body.classList.remove( 'modal-open' );
		}
	}
}

function setUpModal( button ) {
	button.addEventListener( 'click', event => {
		event.preventDefault();
		window.scrollTo( 0, 0 );

		document.body.classList.add( 'modal-open' );

		const url = button.getAttribute( 'href' );
		const dialog = document.createElement( 'dialog' );
		dialog.setAttribute( 'id', 'memberships-modal-window' );
		const iframe = document.createElement( 'iframe' );
		iframe.setAttribute( 'id', 'memberships-modal-iframe' );
		dialog.classList.add( 'jetpack-memberships-modal' );

		document.body.appendChild( dialog );
		dialog.appendChild( iframe );
		iframe.src = url + '&display=alternate&jwt_token=' + getTokenFromCookie();
		iframe.setAttribute( 'frameborder', '0' );
		iframe.setAttribute( 'allowtransparency', 'true' );
		iframe.setAttribute( 'allowfullscreen', 'true' );
		/*
		iframe.addEventListener( 'load', iframeEvent => {
		} );
		*/

		// resize
		const size = document.body.getBoundingClientRect();
		dialog.width = size.width;
		dialog.height = size.height;

		// not clear if this is needed
		/*
		const MODAL_WIDTH = 630;
		const MODAL_HEIGHT = 440;
		iframe.style.marginLeft = '-' + parseInt( MODAL_WIDTH / 2, 10 ) + 'px';
		iframe.style.marginTop = '-' + parseInt( MODAL_HEIGHT / 2, 10 ) + 'px';
		*/

		dialog.showModal();

		window.addEventListener( 'message', handleIframeResult, false );
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
			setUpModal( button );
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

const updateQueryStringParameter = function ( uri, key, value ) {
	const re = new RegExp( '([?&])' + key + '=.*?(&|$)', 'i' );
	const separator = uri.indexOf( '?' ) !== -1 ? '&' : '?';
	if ( uri.match( re ) ) {
		return uri.replace( re, '$1' + key + '=' + value + '$2' );
	}
	return uri + separator + key + '=' + value;
};

export const setPurchaseResultCookie = function ( premiumContentJWTToken ) {
	// We will set this in a cookie  - just in case. This will be reloaded in the refresh, when user clicks OK.
	// But user can close the browser window before clicking OK. IN that case, we want to leave a cookie behind.
	const date = new Date();
	date.setTime( date.getTime() + 365 * 24 * 60 * 60 * 1000 );
	document.cookie =
		'jp-premium-content-session' +
		'=' +
		premiumContentJWTToken +
		'; expires=' +
		date.toGMTString() +
		'; path=/';
};

export const reloadPageWithPremiumContentQueryString = function (
	premiumContentJWTToken,
	additionalParams
) {
	let newQueryString = updateQueryStringParameter(
		document.location.href,
		'token',
		premiumContentJWTToken
	);
	if ( additionalParams ) {
		Object.keys( additionalParams ).forEach( key => {
			newQueryString = updateQueryStringParameter( newQueryString, key, additionalParams[ key ] );
		} );
	}
	document.location.href = newQueryString;
};
