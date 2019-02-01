/* jshint onevar: false */

( function() {
	/**
	 * For images lacking explicit dimensions and needing them, try to add them.
	 */
	var restore_dims = function() {
		var elements = document.querySelectorAll( 'img[data-recalc-dims]' );

		// Use this syntax for IE support https://stackoverflow.com/a/43743720/3078381
		Array.prototype.forEach.call( elements, function recalc( element ) {
			if ( element.complete ) {
				// Support for lazy loading: if there is a lazy-src attribute and it's value
				// is not the same as the current src we should wait until the image load event
				var lazySrc = element.getAttribute('data-lazy-src');
				if ( lazySrc && element.src !== lazySrc ) {
					element.addEventListener( 'load', recalc );
					return;
				}

				// Copying CSS width/height into element attributes.
				// Why? https://stackoverflow.com/q/3562296/3078381
				var width = element.width;
				var height = element.height;
				if ( width && width > 0 && height && height > 0 ) {
					element.width = width;
					element.height = height;

					reset_for_retina( element );
				}
			}
			else {
				element.addEventListener( 'load', recalc );
			}
		} );
	},

	/**
	 * Modify given image's markup so that devicepx-jetpack.js will act on the image and it won't be reprocessed by this script.
	 */
	reset_for_retina = function( img ) {
		img.removeAttribute( 'data-recalc-dims' );
		img.removeAttribute( 'scale' );
	};

	// Vanilla version of jQuery.ready()
	var ready = function( fn ) {
		if ( document.attachEvent ? document.readyState === 'complete' : document.readyState !== 'loading' ) {
			fn();
		} else {
			document.addEventListener( 'DOMContentLoaded', fn );
		}
	};
	/**
	 * Check both when page loads, and when IS is triggered.
	 */
	ready( restore_dims );
	document.body.addEventListener( 'post-load', restore_dims );
} )();
