( function( $ ) {
	'use strict';

	// Don't allow navigation away from the AMP page in the preview.
	// The Customizer breaks pretty spectacularly when that happens as it's only meant to work for AMP pages.
	$( 'a' ).click( function( e ) {
		var href = this.getAttribute( 'href' );
		if ( href && href.indexOf( '#' ) === 0 ) {
			return true;
		}

		return false;
	} );

} )( jQuery );
