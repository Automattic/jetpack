/* eslint-disable no-var */
/* global wp, calypsoifyGutenberg */

jQuery( function( $ ) {
	/**
	 * Checks self and top to determine if we are being loaded in an iframe.
	 * Can't use window.frameElement because we are being embedded from a different origin.
	 * @returns {boolean} Returns `true` if we are being loaded in an iframe,
	 *  else `false`.
	 */
	function inIframe() {
		try {
			return window.self !== window.top;
		} catch ( e ) {
			return true;
		}
	}

	if (
		wp &&
		wp.data &&
		wp.data.select &&
		! wp.data.select( 'core/edit-post' ).isFeatureActive( 'fullscreenMode' )
	) {
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

	if ( inIframe() ) {
		// Modify Notice action links in order to open them in parent window and not in a child iframe.
		var viewPostLinkSelectors = [
			'.components-notice-list .components-notice__action.is-link', // View Post link in success notice
			'.post-publish-panel__postpublish .components-panel__body.is-opened a', // Post title link in publish panel
			'.components-panel__body.is-opened .post-publish-panel__postpublish-buttons a.components-button', // View Post button in publish panel
		].join( ',' );
		$( '#editor' ).on( 'click', viewPostLinkSelectors, function( e ) {
			e.preventDefault();
			window.open( this.href, '_top' );
		} );

		var manageReusableBlocksLinkSelectors = [
			'.editor-inserter__manage-reusable-blocks', // Link in the Blocks Inserter
			'a.components-menu-item__button[href*="post_type=wp_block"]', // Link in the More Menu
		].join( ',' );
		$( '#editor' ).on( 'click', manageReusableBlocksLinkSelectors, function( e ) {
			e.preventDefault();
			window.open( calypsoifyGutenberg.manageReusableBlocksUrl, '_top' );
		} );
	}
} );
