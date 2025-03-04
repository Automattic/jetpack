import domReady from '@wordpress/dom-ready';

import './style.scss';

domReady( function () {
	const millisInDay = 86400000;
	const container = document.querySelector( '.wp-block-jetpack-cookie-consent' );

	// The consent block might not be always available
	if ( ! container ) {
		return;
	}

	const expiryDaysContainer = container.querySelector( 'span' );
	const expireDays = parseInt( expiryDaysContainer.textContent );
	const expireTimeDate = new Date( Date.now() + expireDays * millisInDay );
	const cookieName = 'eucookielaw';
	const button = container.querySelector( '.wp-block-button a' );
	button.setAttribute( 'role', 'button' );
	button.setAttribute( 'href', '#' );
	button.addEventListener( 'click', event => {
		if ( button.closest( '.wp-block-jetpack-cookie-consent' ) ) {
			// This simply prevents adding a # to the URL after the click.
			event.preventDefault();
		}
	} );
	/**
	 * Set cookie and trigger dismiss event
	 */
	function triggerDismissEvent() {
		try {
			document.cookie = `${ cookieName }=${ expireTimeDate.getTime() };path=/;expires=${ expireTimeDate.toGMTString() }`;
			remove();
			const dismissEvent = new Event( 'eucookielaw-dismissed' );
			document.dispatchEvent( dismissEvent );
		} catch {
			// Avoid sending an error to the browser console.
		}
	}

	/**
	 * Removes the dom element
	 */
	function remove() {
		container.classList.add( 'is-dismissed' );
		container.addEventListener( 'transitionend', () => container.remove() );
	}

	button.addEventListener( 'click', triggerDismissEvent );
} );
