(function( $, wp ){
	'use strict';
	wp.customize.bind( 'ready', function(){
		// Core logo
		if ( wp.customize( 'custom_logo' ) ) {
			var id = '#customize-control-custom_logo';
			wp.customize( 'custom_logo' ).bind( 'change', function( to, from ) {
				if ( ! to ) {
					insertLogoButton( id );
				}
			});

			if ( ! wp.customize( 'custom_logo' ) ) {
				insertLogoButton( id );
			}
		}
		// Jetpack logo
		if ( wp.customize( 'site_logo' ) ) {
			var id = '#customize-control-site_logo';
			wp.customize( 'site_logo' ).bind( 'change', function( to, from ) {
				if ( ! to.url ) {
					insertLogoButton( id );
				}
			});

			if ( ! wp.customize( 'site_logo' ) ) {
				insertLogoButton( id );
			}
		}
	});

	function insertLogoButton( id ) {
		var button = $( '<a class="button" target="_blank" href="https://logojoy.grsm.io/WordPress" />' ).text( _Logojoy_l10n.create ).css({
			height: 'auto',
			marginRight: '8px',
			textAlign: 'center',
			width: '48%',
		});
		// timeout lets us render after the core control finishes
		setTimeout( function(){
			$( id + ' .actions' ).prepend( button );
		}, 10 );
	}
})( jQuery, wp );
