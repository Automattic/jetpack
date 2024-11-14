import './additional-css.css';

( function ( $ ) {
	// eslint-disable-next-line strict
	'use strict';

	const cssNudge = {
		init: function () {
			this.clickifyNavigateToButtons();
		},

		clickifyNavigateToButtons: function () {
			const navButton = document.querySelector( '.navigate-to' );
			if ( ! navButton ) {
				return;
			}

			navButton.addEventListener( 'click', function () {
				// Get destination.
				const destination = this.getAttribute( 'data-navigate-to-page' );

				if ( ! destination ) {
					return;
				}

				// Fire Tracks click event.
				window._tkq = window._tkq || [];
				window._tkq.push( [
					'recordEvent',
					'calypso_upgrade_nudge_cta_click',
					{
						cta_name: 'customizer_css',
					},
				] );

				// Navigate to a different page.
				if (
					window.location.search.match( /calypso=true/ ) &&
					window.parent.location !== window.location
				) {
					// Calypso.
					window.top.postMessage(
						JSON.stringify( {
							calypso: true,
							command: 'navigateTo',
							destination: destination,
						} ),
						'*'
					);
				} else {
					// Non-Calypso.
					window.location = 'https://wordpress.com' + destination;
				}
			} );
		},
	};

	$( document ).ready( function () {
		cssNudge.init();
	} );
} )( jQuery );
