( function( $ ) {
	$( document.body ).on( 'post-load', function( response ) {
		// New posts have been added to the page. Re-typeset MathJax if necessary.
		if ( typeof MathJax !== 'undefined' ) {
			MathJax.Hub.Queue( [
				'Typeset',
				MathJax.Hub,
				jQuery('.infinite-wrap').get().pop() // Only typeset in the newest infinite-wrap element.
			] );
		}
	} );
} )( jQuery );
