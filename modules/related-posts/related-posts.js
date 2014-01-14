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

			var html = '';
			$.each( posts, function( index, post ) {
				html += '<p class="jp-relatedposts-post jp-relatedposts-post' + index + '" data-post-format="' + post.format + '">';
				if ( post.thumbnail ) {
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
