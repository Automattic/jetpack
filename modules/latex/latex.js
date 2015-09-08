( function( $ ) {
	$( document.body ).on( 'post-load', function() {
		// New posts have been added to the page. Re-typeset MathJax if necessary.
		if ( typeof MathJax !== 'undefined' ) {
			MathJax.Hub.Queue( [ 'Typeset', MathJax.Hub ] );
		}
	} );
} )( jQuery );
