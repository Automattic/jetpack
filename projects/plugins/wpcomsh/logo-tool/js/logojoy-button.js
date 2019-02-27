(function( $, wp ){
	'use strict';
	wp.customize.bind( 'ready', function(){
		wp.customize( 'custom_logo' ).bind( 'change', function( to, from ) {
			if ( ! to ) {
				insertLogoButton();
			}
		});

		// only if it changes
		if ( ! wp.customize( 'custom_logo' )() ) {
			insertLogoButton();
		}
	});

	function insertLogoButton() {
		var button = $( '<a class="button" target="_blank" href="https://logojoy.grsm.io/WordPress" />' ).text( _Logojoy_l10n.create ).css({
			marginRight: '8px',
			height: 'auto'
		});
		// timeout lets us render after the core control finishes
		setTimeout( function(){
			$( '#customize-control-custom_logo .actions' ).prepend( button );
		}, 10 );

	}

})( jQuery, wp );
