/**
 * IMPORTANT: All changes in this plugin should be synced between wpcom (Simple Sites) and wpcomsh (Atomic Sites).
 */

(function( $, wp, LogoTool ){
	'use strict';

	wp.customize.bind( 'ready', function() {
		var logoThumbnail, logoControlId = '#customize-control-' + LogoTool.controlId;

		if ( wp.customize( 'site_logo' ) ) {
			// Jetpack logo, which has a slightly different HTML structure.
			logoThumbnail = $( logoControlId + ' .site-logo-thumbnail' );
			wp.customize( 'site_logo' ).bind( 'change', function( to, from ) {
				if ( ! to.url ) {
					insertLogoButton( logoControlId );
					showLogoDescription( logoControlId );
				} else {
					removeLogoButton( logoControlId );
					hideLogoDescription( logoControlId );
				}
			});

			if ( ! logoThumbnail || ! logoThumbnail.attr( 'src' ) ) {
				insertLogoButton( logoControlId );
				showLogoDescription( logoControlId );
			} else {
				hideLogoDescription( logoControlId );
			}
		} else if ( wp.customize( LogoTool.controlId ) ) {
			// Core `custom-logo` or a theme specific logo that uses the same type of customize control.
			logoThumbnail = $( logoControlId + ' .thumbnail' );
			wp.customize( LogoTool.controlId ).bind( 'change', function( to, from ) {
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
		var button = $( '<a class="button create-logo-button" target="_blank" href="logo-maker-p2" />' ).text( LogoTool.l10n.create );

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
