/* globals related_posts_js_options */

/**
 * Load related posts
 */
( function () {
	'use strict';

	var jprp = {
		response: null,

		/**
		 * Utility get related posts JSON endpoint from URLs
		 *
		 * @param {string} URL (optional)
		 * @return {string} Endpoint URL
		 */
		getEndpointURL: function ( URL ) {
			var locationObject,
				is_customizer =
					'undefined' !== typeof wp &&
					wp.customize &&
					wp.customize.settings &&
					wp.customize.settings.url &&
					wp.customize.settings.url.self;

			// If we're in Customizer, write the correct URL.
			if ( is_customizer ) {
				locationObject = document.createElement( 'a' );
				locationObject.href = wp.customize.settings.url.self;
			} else {
				locationObject = document.location;
			}

			if ( 'string' === typeof URL && URL.match( /^https?:\/\// ) ) {
				locationObject = document.createElement( 'a' );
				locationObject.href = URL;
			}

			var args = 'relatedposts=1';
			var relatedPosts = document.querySelector( '#jp-relatedposts' );

			if ( ! relatedPosts ) {
				return false;
			}

			if ( relatedPosts.hasAttribute( 'data-exclude' ) ) {
				args += '&relatedposts_exclude=' + relatedPosts.getAttribute( 'data-exclude' );
			}

			if ( is_customizer ) {
				args += '&jetpackrpcustomize=1';
			}

			var pathname = locationObject.pathname;
			if ( '/' !== pathname[ 0 ] ) {
				pathname = '/' + pathname;
			}

			if ( '' === locationObject.search ) {
				return pathname + '?' + args;
			}
			return pathname + locationObject.search + '&' + args;
		},

		getAnchor: function ( post, classNames ) {
			var anchorTitle = post.title;
			var anchor = document.createElement( 'a' );
			anchor.setAttribute( 'class', classNames );
			anchor.setAttribute( 'href', post.url );
			anchor.setAttribute( 'title', anchorTitle );
			anchor.setAttribute( 'data-origin', post.url_meta.origin );
			anchor.setAttribute( 'data-position', post.url_meta.position );

			if ( '' !== post.rel ) {
				anchor.setAttribute( 'rel', post.rel );
			}

			return anchor;
		},

		cleanHtml: function ( str ) {
			var div = document.createElement( 'div' );
			div.innerHTML = str;
			return div.textContent || div.innerText || '';
		},

		generateMinimalDiv: function ( posts, options ) {
			var self = this;
			var div = document.createElement( 'div' );
			div.setAttribute(
				'class',
				'jp-relatedposts-items jp-relatedposts-items-minimal jp-relatedposts-' + options.layout
			);

			posts.forEach( function ( post, index ) {
				var classes = 'jp-relatedposts-post jp-relatedposts-post' + index;

				if ( post.classes.length > 0 ) {
					classes += ' ' + post.classes.join( ' ' );
				}

				var p = document.createElement( 'p' );
				p.setAttribute( 'class', classes );
				p.setAttribute( 'data-post-id', post.id );
				p.setAttribute( 'data-post-format', post.format );
				div.appendChild( p );

				var titleSpan = document.createElement( 'span' );
				titleSpan.setAttribute( 'class', 'jp-relatedposts-post-title' );
				p.appendChild( titleSpan );

				var anchor = self.getAnchor( post, 'jp-relatedposts-post-a' );
				titleSpan.appendChild( anchor );
				anchor.textContent = self.cleanHtml( post.title );

				if ( options.showDate ) {
					var timeElt = document.createElement( 'time' );
					timeElt.setAttribute( 'class', 'jp-relatedposts-post-date' );
					timeElt.setAttribute( 'datetime', post.date );
					timeElt.textContent = post.date;
					p.appendChild( timeElt );
				}
				if ( options.showContext ) {
					var contextSpan = document.createElement( 'span' );
					contextSpan.setAttribute( 'class', 'jp-relatedposts-post-context' );
					contextSpan.textContent = self.cleanHtml( post.context );
					p.appendChild( contextSpan );
				}
			} );
			return div;
		},

		generateVisualDiv: function ( posts, options ) {
			var self = this;
			var div = document.createElement( 'div' );
			div.setAttribute(
				'class',
				'jp-relatedposts-items jp-relatedposts-items-visual jp-relatedposts-' + options.layout
			);

			posts.forEach( function ( post, index ) {
				var classes = 'jp-relatedposts-post jp-relatedposts-post' + index;

				if ( post.classes.length > 0 ) {
					classes += ' ' + post.classes.join( ' ' );
				}

				if ( ! post.img.src ) {
					classes += ' jp-relatedposts-post-nothumbs';
				} else {
					classes += ' jp-relatedposts-post-thumbs';
				}

				var innerDiv = document.createElement( 'div' );
				innerDiv.setAttribute( 'class', classes );
				innerDiv.setAttribute( 'data-post-id', post.id );
				innerDiv.setAttribute( 'data-post-format', post.format );
				div.appendChild( innerDiv );

				if ( post.img.src ) {
					var imgAnchor = self.getAnchor( post, 'jp-relatedposts-post-a' );
					innerDiv.appendChild( imgAnchor );

					var img = document.createElement( 'img' );
					img.setAttribute( 'class', 'jp-relatedposts-post-img' );
					img.setAttribute( 'loading', 'lazy' );
					img.setAttribute( 'src', post.img.src );
					img.setAttribute( 'width', post.img.width );
					img.setAttribute( 'height', post.img.height );
					if ( post.img.srcset ) {
						img.setAttribute( 'srcset', post.img.srcset );
					}
					if ( post.img.sizes ) {
						img.setAttribute( 'sizes', post.img.sizes );
					}
					img.setAttribute( 'alt', post.img.alt_text );
					imgAnchor.appendChild( img );
				} else {
					var anchor_overlay = self.getAnchor(
						post,
						'jp-relatedposts-post-a jp-relatedposts-post-aoverlay'
					);
					innerDiv.appendChild( anchor_overlay );
				}
				var heading = document.createElement( related_posts_js_options.post_heading );
				heading.setAttribute( 'class', 'jp-relatedposts-post-title' );
				innerDiv.appendChild( heading );

				var headingAnchor = self.getAnchor( post, 'jp-relatedposts-post-a' );
				headingAnchor.textContent = self.cleanHtml( post.title );
				heading.appendChild( headingAnchor );

				var p = document.createElement( 'p' );
				p.setAttribute( 'class', 'jp-relatedposts-post-excerpt' );
				p.textContent = self.cleanHtml( post.excerpt );
				innerDiv.appendChild( p );

				if ( options.showDate ) {
					var timeElt = document.createElement( 'time' );
					timeElt.setAttribute( 'class', 'jp-relatedposts-post-date' );
					timeElt.setAttribute( 'datetime', post.date );
					timeElt.textContent = post.date;
					innerDiv.appendChild( timeElt );
				}
				if ( options.showContext ) {
					var contextP = document.createElement( 'p' );
					contextP.setAttribute( 'class', 'jp-relatedposts-post-context' );
					contextP.textContent = self.cleanHtml( post.context );
					innerDiv.appendChild( contextP );
				}
			} );
			return div;
		},

		/**
		 * We want to set a max height on the excerpt however we want to set
		 * this according to the natual pacing of the page as we never want to
		 * cut off a line of text in the middle so we need to do some detective
		 * work.
		 */
		setVisualExcerptHeights: function () {
			var elements = document.querySelectorAll(
				'#jp-relatedposts .jp-relatedposts-post-nothumbs .jp-relatedposts-post-excerpt'
			);

			if ( ! elements.length ) {
				return;
			}

			var firstElementStyles = getComputedStyle( elements[ 0 ] );

			var fontSize = parseInt( firstElementStyles.fontSize, 10 );
			var lineHeight = parseInt( firstElementStyles.lineHeight, 10 );

			// Show 5 lines of text
			for ( var i = 0; i < elements.length; i++ ) {
				elements[ i ].style.maxHeight = ( 5 * lineHeight ) / fontSize + 'em';
			}
		},

		getTrackedUrl: function ( anchor ) {
			var args = 'relatedposts_hit=1';
			args += '&relatedposts_origin=' + anchor.getAttribute( 'data-origin' );
			args += '&relatedposts_position=' + anchor.getAttribute( 'data-position' );

			var pathname = anchor.pathname;
			if ( '/' !== pathname[ 0 ] ) {
				pathname = '/' + pathname;
			}

			if ( '' === anchor.search ) {
				return pathname + '?' + args;
			}
			return pathname + anchor.search + '&' + args;
		},

		cleanupTrackedUrl: function () {
			if ( 'function' !== typeof history.replaceState ) {
				return;
			}

			var cleaned_search = document.location.search.replace(
				/\brelatedposts_[a-z]+=[0-9]*&?\b/gi,
				''
			);
			if ( '?' === cleaned_search ) {
				cleaned_search = '';
			}
			if ( document.location.search !== cleaned_search ) {
				history.replaceState( {}, document.title, document.location.pathname + cleaned_search );
			}
		},
	};

	function afterPostsHaveLoaded() {
		jprp.setVisualExcerptHeights();
		var posts = document.querySelectorAll( '#jp-relatedposts a.jp-relatedposts-post-a' );

		Array.prototype.forEach.call( posts, function ( post ) {
			document.addEventListener( 'click', function () {
				post.href = jprp.getTrackedUrl( post );
			} );
		} );
	}

	/**
	 * Initialize Related Posts.
	 */
	function startRelatedPosts() {
		jprp.cleanupTrackedUrl();

		var endpointURL = jprp.getEndpointURL();

		if ( ! endpointURL ) {
			return;
		}

		if ( document.querySelectorAll( '#jp-relatedposts .jp-relatedposts-post' ).length ) {
			afterPostsHaveLoaded();
			return;
		}

		var relatedPosts = document.querySelector( '#jp-relatedposts' );
		var request = new XMLHttpRequest();
		request.open( 'GET', endpointURL, true );
		request.setRequestHeader( 'x-requested-with', 'XMLHttpRequest' );

		request.onreadystatechange = function () {
			if ( this.readyState === XMLHttpRequest.DONE && this.status === 200 ) {
				try {
					var response = JSON.parse( request.responseText );

					if ( 0 === response.items.length || 0 === relatedPosts.length ) {
						return;
					}

					jprp.response = response;

					var showThumbnails,
						options = {};

					if ( 'undefined' !== typeof wp && wp.customize ) {
						showThumbnails = wp.customize.instance( 'jetpack_relatedposts[show_thumbnails]' ).get();
						options.showDate = wp.customize.instance( 'jetpack_relatedposts[show_date]' ).get();
						options.showContext = wp.customize
							.instance( 'jetpack_relatedposts[show_context]' )
							.get();
						options.layout = wp.customize.instance( 'jetpack_relatedposts[layout]' ).get();
					} else {
						showThumbnails = response.show_thumbnails;
						options.showDate = response.show_date;
						options.showContext = response.show_context;
						options.layout = response.layout;
					}

					var div = ! showThumbnails
						? jprp.generateMinimalDiv( response.items, options )
						: jprp.generateVisualDiv( response.items, options );

					relatedPosts.appendChild( div );

					if ( options.showDate ) {
						var dates = relatedPosts.querySelectorAll( '.jp-relatedposts-post-date' );

						Array.prototype.forEach.call( dates, function ( date ) {
							date.style.display = 'block';
						} );
					}

					relatedPosts.style.display = 'block';
					afterPostsHaveLoaded();
				} catch {
					// Do nothing
				}
			}
		};

		request.send();
	}

	function init() {
		if ( 'undefined' !== typeof wp && wp.customize ) {
			if ( wp.customize.selectiveRefresh ) {
				wp.customize.selectiveRefresh.bind( 'partial-content-rendered', function ( placement ) {
					if ( 'jetpack_relatedposts' === placement.partial.id ) {
						startRelatedPosts();
					}
				} );
			}
			wp.customize.bind( 'preview-ready', startRelatedPosts );
		} else {
			startRelatedPosts();
		}
	}

	if ( document.readyState !== 'loading' ) {
		init();
	} else {
		document.addEventListener( 'DOMContentLoaded', init );
	}
} )();
