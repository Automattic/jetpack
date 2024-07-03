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
			// For avoiding Firefox reload, we need to force reload bypassing the cache.
			window.location.reload( true );
		} else if ( data && data.action === 'close' ) {
			// User just aborted.
			window.removeEventListener( 'message', handleIframeResult );
			const dialog = document.getElementById( 'memberships-modal-window' );
			dialog.close();
			document.body.classList.remove( 'jetpack-memberships-modal-open' );
		}
	}
}

export function showModal( url ) {
	return new Promise( resolvePromise => {
		const existingModal = document.getElementById( 'memberships-modal-window' );
		if ( existingModal ) {
			document.body.removeChild( existingModal );
		}

		const dialog = document.createElement( 'dialog' );
		dialog.setAttribute( 'id', 'memberships-modal-window' );
		dialog.classList.add( 'jetpack-memberships-modal' );
		dialog.classList.add( 'is-loading' );

		const iframe = document.createElement( 'iframe' );
		iframe.setAttribute( 'frameborder', '0' );
		iframe.setAttribute( 'allowtransparency', 'true' );
		iframe.setAttribute( 'allowfullscreen', 'true' );

		iframe.addEventListener( 'load', function () {
			// prevent double scroll bars. We use the entire viewport for the modal so we need to hide overflow on the body element.
			document.body.classList.add( 'jetpack-memberships-modal-open' );
			dialog.classList.remove( 'is-loading' );
			resolvePromise();
		} );

		iframe.setAttribute( 'id', 'memberships-modal-iframe' );
		iframe.innerText =
			'This feature requires inline frames. You have iframes disabled or your browser does not support them.';
		iframe.src = url + '&display=alternate&jwt_token=' + getTokenFromCookie();

		const siteLanguage = document.querySelector( 'input[name="lang"]' )?.value;
		if ( siteLanguage ) {
			iframe.src = iframe.src + '&lang=' + siteLanguage;
		}
		document.body.appendChild( dialog );
		dialog.appendChild( iframe );

		window.addEventListener( 'message', handleIframeResult, false );
		dialog.showModal();
	} );
}

export const spinner =
	'<span class="jetpack-memberships-spinner">' +
		'<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
			'<path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25" fill="currentColor" />' +
			'<path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z" class="jetpack-memberships-spinner-rotating" fill="currentColor" />' +
		'</svg>' +
	'</span>';

function setUpModal( button ) {
	// Injects loading animation in hidden state
	button.insertAdjacentHTML( 'beforeend', spinner );

	button.addEventListener( 'click', event => {
		event.preventDefault();

		// Shows the injected loading animation in button
		button.classList.add( 'is-loading' );
		button.setAttribute( 'aria-busy', 'true' );
		button.setAttribute( 'aria-live', 'polite' );

		const url = button.getAttribute( 'href' );
		showModal( url ).then( () => {
			button.classList.remove( 'is-loading' );
			button.setAttribute( 'aria-busy', 'false' );
		} );

		button.blur();
		return false;
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
			console.error( 'Problem setting up Modal', err );
		}

		button.setAttribute( 'data-jetpack-memberships-button-initialized', 'true' );
	} );
};

const tokenCookieName = 'wp-jp-premium-content-session';
const getTokenFromCookie = function () {
	const value = `; ${ document.cookie }`;
	const parts = value.split( `; ${ tokenCookieName }=` );
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
	const inOneMonthDate = new Date( date.setMonth( date.getMonth() + 1 ) );
	document.cookie = `wp-jp-premium-content-session=${ premiumContentJWTToken }; expires=${ inOneMonthDate.toGMTString() }; path=/`;
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
