import domReady from '@wordpress/dom-ready';

import './style.scss';

domReady( function () {
	const millisInDay = 86400000;
	const container = document.querySelector( '.wp-block-jetpack-cookie-consent' );
	const expiryDaysContainer = container.querySelector( 'span' );
	const expireDays = parseInt( expiryDaysContainer.textContent );
	const expireTimeDate = new Date( Date.now() + expireDays * millisInDay );
	const cookieName = 'eucookielaw';

	const button = container.querySelector( '.wp-block-button a' );
	button.setAttribute( 'role', 'button' );
	button.setAttribute( 'href', 'javascript:void(0)' );
	/**
	 * Set cookie and trigger dismiss event
	 */
	function triggerDismissEvent() {
		try {
			document.cookie = `${ cookieName }=${ expireTimeDate.getTime() };path=/;expires=${ expireTimeDate.toGMTString() }`;
			remove();
			const dismissEvent = new Event( 'eucookielaw-dismissed' );
			document.dispatchEvent( dismissEvent );
		} catch ( err ) {}
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
