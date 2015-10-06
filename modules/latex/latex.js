( function( $ ) {
	'use strict';
	$( document.body ).on( 'post-load', function() {
		// New posts have been added to the page. Re-typeset MathJax if necessary.
		if ( typeof MathJax !== 'undefined' ) {
			$( '.infinite-wrap' ).not( '.mathjax-typeset' ).each( function() {
				var wrap = this;

				MathJax.Hub.Queue( [
					'Typeset',
					MathJax.Hub,
					wrap
				] );

				$( wrap ).addClass( 'mathjax-typeset' );
			} );
		}
	} );
} )( jQuery );
