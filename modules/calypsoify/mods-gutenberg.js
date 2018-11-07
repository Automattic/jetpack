/* eslint-disable no-var */
/* global wp, calypsoifyGutenberg, jQuery */

jQuery( function( $ ) {
	if ( wp && wp.data && wp.data.select && ! wp.data.select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' ) ) {
		wp.data.dispatch( 'core/edit-post' ).toggleFeature( 'fullscreenMode' );
	}

	var editPostHeaderInception = setInterval( function() {
		var $closeButton = $( '.edit-post-fullscreen-mode-close__toolbar a' );
		if ( $closeButton.length < 1 ) {
			return;
		}
		clearInterval( editPostHeaderInception );

		$closeButton.attr( 'href', calypsoifyGutenberg.closeUrl );
	} );

	$( 'body.revision-php a' ).each( function() {
		var href = $( this ).attr( 'href' );
		$( this ).attr( 'href', href.replace( '&classic-editor', '' ) );
	} );

	// Add a "Switch to Classic Editor" button
	$( document ).on( 'click', '.edit-post-more-menu button', function() {
		// We need to wait a few ms until the menu content is rendered
		setTimeout( function() {
			$( '.edit-post-more-menu__content .components-menu-group:last-child > div[role=menu]' ).append(
				'<button type="button" aria-label="' + calypsoifyGutenberg.switchToClassicLabel + '" role="menuitem"' +
				'class="components-button components-menu-item__button components-menu-item__button-switch">' +
				calypsoifyGutenberg.switchToClassicLabel +
				'</button>'
			);

			$( '.components-menu-item__button-switch' ).on( 'click', function() {
				$.post( calypsoifyGutenberg.switchToClassicAPIUrl );
				window.location.replace( calypsoifyGutenberg.switchToClassicRedirectUrl );
			} );
		}, 0 );
	} );
} );
