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
		 * @param  {string} URL (optional)
		 * @return {string} Endpoint URL
		 */
		getEndpointURL: function( URL ) {
			var locationObject,
				is_customizer = 'undefined' !== typeof wp && wp.customize && wp.customize.settings && wp.customize.settings.url && wp.customize.settings.url.self;

			// If we're in Customizer, write the correct URL.
			if ( is_customizer ) {
					locationObject = document.createElement( 'a' );
					locationObject.href = wp.customize.settings.url.self;
			} else {
				locationObject = document.location;
			}

			if ( 'string' === typeof( URL ) && URL.match( /^https?:\/\// ) ) {
				locationObject = document.createElement( 'a' );
				locationObject.href = URL;
			}

			var args = 'relatedposts=1';
			if ( $( '#jp-relatedposts' ).data( 'exclude' ) ) {
				args += '&relatedposts_exclude=' + $( '#jp-relatedposts' ).data( 'exclude' );
			}

			if ( is_customizer ) {
				args += '&jetpackrpcustomize=1';
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

		generateMinimalHtml: function( posts, options ) {
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
				if ( options.showDate ) {
					html += '<span class="jp-relatedposts-post-date">' + post.date + '</span>';
				}
				if ( options.showContext ) {
					html += '<span class="jp-relatedposts-post-context">' + post.context + '</span>';
				}
				html += '</p>';
			} );
			return '<div class="jp-relatedposts-items jp-relatedposts-items-minimal jp-relatedposts-' + options.layout + ' ">' + html + '</div>';
		},

		generateVisualHtml: function( posts, options ) {
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
				if ( options.showDate ) {
					html += '<p class="jp-relatedposts-post-date">' + post.date + '</p>';
				}
				if ( options.showContext ) {
					html += '<p class="jp-relatedposts-post-context">' + post.context + '</p>';
				}
				html += '</div>';
			} );
			return '<div class="jp-relatedposts-items jp-relatedposts-items-visual jp-relatedposts-' + options.layout + ' ">' + html + '</div>';
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

	function afterPostsHaveLoaded() {
		jprp.setVisualExcerptHeights();
		$( '#jp-relatedposts a.jp-relatedposts-post-a' ).click( function() {
			this.href = jprp.getTrackedUrl( this );
		} );
	}

	/**
	 * Initialize Related Posts.
	 */
	function startRelatedPosts() {
		jprp.cleanupTrackedUrl();

		var endpointURL = jprp.getEndpointURL(),
			$relatedPosts = $( '#jp-relatedposts' );

		if ( $( '#jp-relatedposts .jp-relatedposts-post' ).length ) {
			afterPostsHaveLoaded();
			return;
		}

		$.getJSON( endpointURL, function( response ) {
			if ( 0 === response.items.length || 0 === $relatedPosts.length ) {
				return;
			}

			jprp.response = response;

			var html,
				showThumbnails,
				options = {};

			if ( 'undefined' !== typeof wp && wp.customize ) {
				showThumbnails = wp.customize.instance( 'jetpack_relatedposts[show_thumbnails]' ).get();
				options.showDate = wp.customize.instance( 'jetpack_relatedposts[show_date]' ).get();
				options.showContext = wp.customize.instance( 'jetpack_relatedposts[show_context]' ).get();
				options.layout = wp.customize.instance( 'jetpack_relatedposts[layout]' ).get();
			} else {
				showThumbnails = response.show_thumbnails;
				options.showDate = response.show_date;
				options.showContext = response.show_context;
				options.layout = response.layout;
			}

			html = ! showThumbnails ? jprp.generateMinimalHtml( response.items, options ) : jprp.generateVisualHtml( response.items, options );

			$relatedPosts.append( html );
			if ( options.showDate ) {
				$relatedPosts.find( '.jp-relatedposts-post-date' ).show();
			}
			$relatedPosts.show();
			afterPostsHaveLoaded();
		} );
	}

	$( function() {
		if ( 'undefined' !== typeof wp && wp.customize ) {
			if ( wp.customize.selectiveRefresh ) {
				wp.customize.selectiveRefresh.bind( 'partial-content-rendered', function( placement ) {
					if ( 'jetpack_relatedposts' === placement.partial.id ) {
						startRelatedPosts();
					}
				} );
			}
			wp.customize.bind( 'preview-ready', startRelatedPosts );
		} else {
			startRelatedPosts();
		}
	} );

})(jQuery);