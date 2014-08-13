/* jshint onevar: false */

/**
 * Load related posts
 */
(function($) {
	var jprp = {
		response: null,

		/**
		 * Utility get related posts JSON endpoint from URLs
		 *
		 * @param string URL (optional)
		 * @return string endpoint URL
		 */
		getEndpointURL: function( URL ) {
			var locationObject = document.location;

			if ( 'string' === typeof( URL ) && URL.match( /^https?:\/\// ) ) {
				locationObject = document.createElement( 'a' );
				locationObject.href = URL;
			}

			var args = 'relatedposts=1';
			if ( ! $( '#jp-relatedposts' ).data( 'exclude' ) ) {
				args += '&relatedposts_exclude=' + $( '#jp-relatedposts' ).data( 'exclude' );
			}

			if ( '' === locationObject.search ) {
				return locationObject.pathname + '?' + args;
			} else {
				return locationObject.pathname + locationObject.search + '&' + args;
			}
		},

		getAnchor: function( post ) {
			var anchor_title = post.title;
			if ( '' !== ( '' + post.excerpt ) ) {
				anchor_title += '\n\n' + post.excerpt;
			}

			var anchor = $( '<a>' );

			anchor.attr({
				'class': 'jp-relatedposts-post-a',
				'href': post.url,
				'title': anchor_title,
				'rel': 'nofollow',
				'data-origin': post.url_meta.origin,
				'data-position': post.url_meta.position
			});

			var anchor_html = $( '<div>' ).append( anchor ).html();
			return [
				anchor_html.substring( 0, anchor_html.length-4 ),
				'</a>'
			];
		},

		generateMinimalHtml: function( posts ) {
			var self = this;
			var html = '';

			$.each( posts, function( index, post ) {
				var anchor = self.getAnchor( post );
				var classes = 'jp-relatedposts-post jp-relatedposts-post' + index;

				html += '<p class="' + classes + '" data-post-id="' + post.id + '" data-post-format="' + post.format + '">';
				html += '<span class="jp-relatedposts-post-title">' + anchor[0] + post.title + anchor[1] + '</span>';
				html += '<span class="jp-relatedposts-post-context">' + post.context + '</span>';
				html += '</p>';
			} );
			return '<div class="jp-relatedposts-items jp-relatedposts-items-minimal">' + html + '</div>';
		},

		generateVisualHtml: function( posts ) {
			var self = this;
			var html = '';

			$.each( posts, function( index, post ) {
				var anchor = self.getAnchor( post );
				var classes = 'jp-relatedposts-post jp-relatedposts-post' + index;
				if ( ! post.img.src ) {
					classes += ' jp-relatedposts-post-nothumbs';
				} else {
					classes += ' jp-relatedposts-post-thumbs';
				}

				html += '<div class="' + classes + '" data-post-id="' + post.id + '" data-post-format="' + post.format + '">';
				if ( post.img.src ) {
					html += anchor[0] + '<img class="jp-relatedposts-post-img" src="' + post.img.src + '" width="' + post.img.width + '" alt="' + post.title + '" />' + anchor[1];
				}
				html += '<h4 class="jp-relatedposts-post-title">' + anchor[0] + post.title + anchor[1] + '</h4>';
				html += '<p class="jp-relatedposts-post-excerpt">' + post.excerpt + '</p>';
				html += '<p class="jp-relatedposts-post-context">' + post.context + '</p>';
				html += '</div>';
			} );
			return '<div class="jp-relatedposts-items jp-relatedposts-items-visual">' + html + '</div>';
		},

		getTrackedUrl: function( anchor ) {
			var args = 'relatedposts_hit=1';
			args += '&relatedposts_origin=' + $( anchor ).data( 'origin' );
			args += '&relatedposts_position=' + $( anchor ).data( 'position' );

			if ( '' === anchor.search ) {
				return anchor.pathname + '?' + args;
			} else {
				return anchor.pathname + anchor.search + '&' + args;
			}
		},

		cleanupTrackedUrl: function() {
			if ( 'function' !== typeof history.replaceState ) {
				return;
			}

			var cleaned_search = document.location.search.replace( /\brelatedposts_[a-z]+=[0-9]*&?\b/gi, '' );
			if ( '?' === cleaned_search ) {
				cleaned_search = '';
			}
			if ( document.location.search !== cleaned_search ) {
				history.replaceState( {}, document.title, document.location.pathname + cleaned_search );
			}
		}
	};

	$( function() {
		jprp.cleanupTrackedUrl();

		$.getJSON( jprp.getEndpointURL(), function( response ) {
			if ( 0 === response.items.length || 0 === $( '#jp-relatedposts' ).length ) {
				return;
			}

			jprp.response = response;

			var html = '';
			if ( !response.show_thumbnails ) {
				html = jprp.generateMinimalHtml( response.items );
			} else {
				html = jprp.generateVisualHtml( response.items );
			}

			$( '#jp-relatedposts' ).append( html ).show();

			$( '#jp-relatedposts a.jp-relatedposts-post-a' ).click(function() {
				this.href = jprp.getTrackedUrl( this );
			});
		} );
	} );
})(jQuery);
