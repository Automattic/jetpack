/* global jQuery */

( function( $ ) {
	$( document ).ready( function() {
		$( '.jetpack-search-debug-bar .json-toggle-wrap .toggle' ).click( function() {
			var t = $( this ),
				wrap = t.closest( '.json-toggle-wrap' ),
				pre = wrap.find( 'pre' ),
				content = pre.text(),
				isPretty = wrap.hasClass( 'pretty' );

			if ( ! isPretty ) {
				pre.text( JSON.stringify( JSON.parse( content ), null, '\t' ) );
			} else {
				content.replace( '\t', '' ).replace( '\n', '' );
				pre.text( JSON.stringify( JSON.parse( content ) ) );
			}

			wrap.toggleClass( 'pretty' );
		} );
	} );
} )( jQuery );
