/* jshint onevar: false */
/* globals related_posts_js_options */

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
			if ( $( '#jp-relatedposts' ).data( 'exclude' ) ) {
				args += '&relatedposts_exclude=' + $( '#jp-relatedposts' ).data( 'exclude' );
			}

			var pathname = locationObject.pathname;
			if ( '/' !== pathname[0] ) {
				pathname = '/' + pathname;
			}

			if ( '' === locationObject.search ) {
				return pathname + '?' + args;
			} else {
				return pathname + locationObject.search + '&' + args;
			}
		},

		getAnchor: function( post, classNames ) {
			var anchor_title = post.title;
			if ( '' !== ( '' + post.excerpt ) ) {
				anchor_title += '\n\n' + post.excerpt;
			}

			var anchor = $( '<a>' );

			anchor.attr({
				'class': classNames,
				'href': post.url,
				'title': anchor_title,
				'rel': post.rel,
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
				var anchor = self.getAnchor( post, 'jp-relatedposts-post-a' );
				var classes = 'jp-relatedposts-post jp-relatedposts-post' + index;

				if ( post.classes.length > 0 ) {
					classes += ' ' + post.classes.join( ' ' );
				}

				html += '<p class="' + classes + '" data-post-id="' + post.id + '" data-post-format="' + post.format + '">';
				html += '<span class="jp-relatedposts-post-title">' + anchor[0] + post.title + anchor[1] + '</span>';
				html += '<span class="jp-relatedposts-post-date">' + post.date + '</span>';
				html += '<span class="jp-relatedposts-post-context">' + post.context + '</span>';
				html += '</p>';
			} );
			return '<div class="jp-relatedposts-items jp-relatedposts-items-minimal">' + html + '</div>';
		},

		generateVisualHtml: function( posts ) {
			var self = this;
			var html = '';

			$.each( posts, function( index, post ) {
				var anchor = self.getAnchor( post, 'jp-relatedposts-post-a' );
				var classes = 'jp-relatedposts-post jp-relatedposts-post' + index;

				if ( post.classes.length > 0 ) {
					classes += ' ' + post.classes.join( ' ' );
				}

				if ( ! post.img.src ) {
					classes += ' jp-relatedposts-post-nothumbs';
				} else {
					classes += ' jp-relatedposts-post-thumbs';
				}

				html += '<div class="' + classes + '" data-post-id="' + post.id + '" data-post-format="' + post.format + '">';
				if ( post.img.src ) {
					html += anchor[0] + '<img class="jp-relatedposts-post-img" src="' + post.img.src + '" width="' + post.img.width + '" alt="' + post.title + '" />' + anchor[1];
				} else {
					var anchor_overlay = self.getAnchor( post, 'jp-relatedposts-post-a jp-relatedposts-post-aoverlay' );
					html += anchor_overlay[0] + anchor_overlay[1];
				}
				html += '<' + related_posts_js_options.post_heading + ' class="jp-relatedposts-post-title">' + anchor[0] + post.title + anchor[1] + '</' + related_posts_js_options.post_heading + '>';
				html += '<p class="jp-relatedposts-post-excerpt">' + $( '<p>' ).text( post.excerpt ).html() + '</p>';
				html += '<p class="jp-relatedposts-post-date">' + post.date + '</p>';
				html += '<p class="jp-relatedposts-post-context">' + post.context + '</p>';
				html += '</div>';
			} );
			return '<div class="jp-relatedposts-items jp-relatedposts-items-visual">' + html + '</div>';
		},

		/**
		 * We want to set a max height on the excerpt however we want to set
		 * this according to the natual pacing of the page as we never want to
		 * cut off a line of text in the middle so we need to do some detective
		 * work.
		 */
		setVisualExcerptHeights: function() {
			var elements = $( '#jp-relatedposts .jp-relatedposts-post-nothumbs .jp-relatedposts-post-excerpt' );

			if ( 0 >= elements.length ) {
				return;
			}

			var fontSize = parseInt( elements.first().css( 'font-size' ), 10 ),
				lineHeight = parseInt( elements.first().css( 'line-height' ), 10 );

			// Show 5 lines of text
			elements.css(
				'max-height',
				( 5 * lineHeight / fontSize ) + 'em'
			);
		},

		getTrackedUrl: function( anchor ) {
			var args = 'relatedposts_hit=1';
			args += '&relatedposts_origin=' + $( anchor ).data( 'origin' );
			args += '&relatedposts_position=' + $( anchor ).data( 'position' );

			var pathname = anchor.pathname;
			if ( '/' !== pathname[0] ) {
				pathname = '/' + pathname;
			}

			if ( '' === anchor.search ) {
				return pathname + '?' + args;
			} else {
				return pathname + anchor.search + '&' + args;
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

			$( '#jp-relatedposts' ).append( html );
			jprp.setVisualExcerptHeights();
			$( '#jp-relatedposts' ).show();

			$( '#jp-relatedposts a.jp-relatedposts-post-a' ).click(function() {
				this.href = jprp.getTrackedUrl( this );
			});
		} );
	} );
})(jQuery);
