/* global jetpackMailchimpPopup */

( function( $ ) {
	/**
	 * Create a cookie
	 * @param {string} key Cookie key.
	 * @param {string} value Cookie value.
	 * @param {integer} expiry Number of days for the cookie to expire.
	 */
	function setCookie( key, value, expiry ) {
		var expires = new Date();
		expires.setTime( expires.getTime() + expiry * 24 * 60 * 60 * 1000 );
		document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
	}

	/**
	 * Get a cookie value.
	 * @param {string} key Cookie key.
	 */
	function getCookie( key ) {
		var keyValue = document.cookie.match( '(^|;) ?' + key + '=([^;]*)(;|$)' );
		return keyValue ? keyValue[ 2 ] : null;
	}

	/**
	 * Generate the modal.
	 */
	function generateModal() {
		var body = $( 'body' );
		var overlay = $( '<div>', { class: 'jetpack_mailchimp_widget_overlay' } );
		var closeButton = $( '<span>', { class: 'jetpack_mailchimp_widget_close' } );

		closeButton.click( function() {
			overlay.remove();
			body.css( 'overflow', 'auto' );
		} );

		var mailchimpForm = $( '.jetpack_mailchimp_widget_form' ).clone();
		$( '.jetpack_mailchimp_widget_form' ).remove();
		mailchimpForm.attr( 'style', '' );
		mailchimpForm.prepend( closeButton );

		overlay.append( mailchimpForm );

		body.append( overlay ).css( 'overflow', 'hidden' );
	}

	$( document ).ready( function() {
		var cookieName = 'jetpackMailchimpPopUpClosed';

		//if ( 'yes' !== getCookie( cookieName ) ) {
		setTimeout( generateModal, jetpackMailchimpPopup.delay );
		setCookie( cookieName, 'yes', 365 );
		//}
	} );
} )( jQuery );
