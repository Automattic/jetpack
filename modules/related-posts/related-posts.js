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

	getAnchor = function( post ) {
		if ( '' == post.excerpt )
			var anchor_title = post.title;
		else
			var anchor_title = post.title + "\n\n" + post.excerpt;

		return [
			'<a href="' + post.url + '" title="' + anchor_title.replace(/"/g, '&quot;') + '" rel="nofollow">',
			'</a>'
		];
	}

	generateMinimalHtml = function( posts ) {
		var html = '';
		$.each( posts, function( index, post ) {
			var anchor = getAnchor( post );
			var classes = 'jp-relatedposts-post jp-relatedposts-post' + index;

			html += '<p class="' + classes + '" data-post-id="' + post.id + '" data-post-format="' + post.format + '">';
			html += '<span class="jp-relatedposts-post-title">' + anchor[0] + post.title + anchor[1] + '</span>';
			html += '<span class="jp-relatedposts-post-context">' + post.context + '</span>';
			html += '</p>';
		} );
		return '<div class="jp-relatedposts-items jp-relatedposts-items-minimal">' + html + '</div>';
	}

	generateVisualHtml = function( posts ) {
		var html = '';
		$.each( posts, function( index, post ) {
			var anchor = getAnchor( post );
			var classes = 'jp-relatedposts-post jp-relatedposts-post' + index;
			if ( '' == post.img.src )
				classes += ' jp-relatedposts-post-nothumbs';
			else
				classes += ' jp-relatedposts-post-thumbs';

			html += '<div class="' + classes + '" data-post-id="' + post.id + '" data-post-format="' + post.format + '">';
			if ( '' != post.img.src )
				html += anchor[0] + '<img src="' + post.img.src + '" width="' + post.img.width + '" alt="' + post.title + '" />' + anchor[1];
			html += '<h4 class="jp-relatedposts-post-title">' + anchor[0] + post.title + anchor[1] + '</h4>';
			html += '<p class="jp-relatedposts-post-excerpt">' + post.excerpt + '</p>';
			html += '<p class="jp-relatedposts-post-context">' + post.context + '</p>';
			html += '</div>';
		} );
		return '<div class="jp-relatedposts-items jp-relatedposts-items-visual">' + html + '</div>';
	}

	$( function() {
		$.getJSON( getEndpointURL(), function( response ) {
			if ( 0 == response.items.length ) {
				return;
			}

			if ( !response.show_thumbnails ) {
				var html = generateMinimalHtml( response.items );
			} else {
				var html = generateVisualHtml( response.items );
			}

			$( '#jp-relatedposts' ).append( html ).show();
		} );
	} );
})(jQuery);