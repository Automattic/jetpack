/**
 * Load related posts
 */
(function($) {
	var getEndpointURL; // Utility get related posts JSON endpoint from URLs

	/**
	 * Utility get related posts JSON endpoint from URLs
	 *
	 * @param string URL (optional)
	 * @return string endpoint URL
	 */
	getEndpointURL = function( URL ) {
		var locationObject = document.location;

		if ( 'string' == typeof( URL ) && URL.match( /^https?:\/\// ) ) {
			locationObject = document.createElement( 'a' );
			locationObject.href = URL;
		}

		if ( '' == locationObject.search ) {
			return locationObject.pathname + '?relatedposts';
		} else {
			return locationObject.pathname + locationObject.search + '&relatedposts';
		}
	};

	$( function() {
		$.getJSON( getEndpointURL(), function( posts ) {
			if ( 0 == posts.length ) {
				return;
			}

			var show_images = true;
			var seen_images = [];
			$.each( posts, function( index, post ) {
				if ( !show_images ) {
					return;
				}

				if ( !post.thumbnail ) {
					show_images = false;
					return;
				}

				var src = $( post.thumbnail ).attr( 'src' );
				if ( -1 != seen_images.indexOf( src ) ) {
					show_images = false;
					return;
				}

				seen_images.push( src );
			} );

			var html = '';
			$.each( posts, function( index, post ) {
				html += '<p class="jp-relatedposts-post jp-relatedposts-post' + index + '" data-post-format="' + post.format + '">';
				if ( show_images ) {
					html += post.thumbnail;
				}
				html += '<strong><a href="' + post.url + '" title="' + post.title + "\n\n" + post.excerpt + '" rel="nofollow">' + post.title + '</a></strong><br>';
				html += '<span>' + post.context + '</span>';
				html += '</p>';
			} );

			$( '#jp-relatedposts' ).append( html ).show();
		} );
	} );
})(jQuery);
