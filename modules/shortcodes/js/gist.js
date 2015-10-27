;(function( $, undefined ) {
	var gistStylesheetLoaded = false,
		gistEmbed = function() {
			$( '.gist-oembed' ).each( function( i, el ) {
				var url = 'https://gist.github.com/' + $( el ).data( 'gist' );

				$.ajax( {
					url: url,
					dataType: 'jsonp'
				} ).done( function( response ) {
					$( el ).replaceWith( response.div );

					if ( ! gistStylesheetLoaded ) {
						var stylesheet = '<link rel="stylesheet" href="' +
										response.stylesheet +
										'" type="text/css" />';

						$( 'head' ).append( stylesheet );

						gistStylesheetLoaded = true;
					}
				} );
			} );
		};

	$( document ).ready( gistEmbed );
	$( 'body' ).on( 'post-load', gistEmbed );
})( jQuery );
