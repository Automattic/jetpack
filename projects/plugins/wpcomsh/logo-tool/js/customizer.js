/**
 * IMPORTANT: All changes in this plugin should be synced between wpcom (Simple Sites) and wpcomsh (Atomic Sites).
 */

(function( $, wp, LogoTool ){
	'use strict';

	wp.customize.bind( 'ready', function() {
		var logoThumbnail, logoControlId = '#customize-control-' + LogoTool.controlId;

		// Could be a Core custom-logo, Jetpack site-logo, or a theme specific logo that uses the same image control.
		if ( wp.customize( LogoTool.settingId ) ) {
			logoThumbnail = $( logoControlId + ' .thumbnail' );
			wp.customize( LogoTool.settingId ).bind( 'change', function( to, from ) {
				if ( ! to ) {
					insertLogoButton( logoControlId );
					showLogoDescription( logoControlId );
				} else {
					// Logo button is removed automatically.
					hideLogoDescription( logoControlId );
				}
			});

			if ( ! logoThumbnail.length ) {
				insertLogoButton( logoControlId );
				showLogoDescription( logoControlId );
			} else {
				// Logo button is removed automatically.
				hideLogoDescription( logoControlId );
			}
		}
	});

	function insertLogoButton( id ) {
		var button = $( '<a class="button create-logo-button" target="_blank" href="https://wp.me/logo-maker" />' ).text( LogoTool.l10n.create );

		// Timeout lets us render after the core control finishes.
		setTimeout( function(){
			$( id + ' .actions' ).prepend( button );
		}, 10 );
	}

	function removeLogoButton( id ) {
		$( id + ' .create-logo-button' ).remove();
	}

	function showLogoDescription( id ) {
		$( id + ' .description' ).show();
	}

	function hideLogoDescription( id ) {
		$( id + ' .description' ).hide();
	}
})( jQuery, wp, _LogoTool_ );
