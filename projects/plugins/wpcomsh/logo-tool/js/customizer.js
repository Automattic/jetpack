(function( $, wp ){
	'use strict';
	wp.customize.bind( 'ready', function() {
		var logoControlId, logoThumbnail;

		// Core custom logo
		if ( wp.customize( 'custom_logo' ) ) {
			logoControlId = '#customize-control-custom_logo';
			logoThumbnail = $( logoControlId + ' .thumbnail' );
			wp.customize( 'custom_logo' ).bind( 'change', function( to, from ) {
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
				// Logo buttin is removed automatically.
				hideLogoDescription( logoControlId );
			}
		}

		// Jetpack logo
		if ( wp.customize( 'site_logo' ) ) {
			logoControlId = '#customize-control-site_logo';
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
		}
	});

	function insertLogoButton( id ) {
		var button = $( '<a class="button create-logo-button" target="_blank" href="https://looka.grsm.io/logo-maker-app" />' ).text( _LogoTool_l10n.create );

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
})( jQuery, wp );
