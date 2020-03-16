/* globals infiniteScroll, _wpmejsSettings, ga, _gaq, WPCOM_sharing_counts, MediaElementPlayer */
( function() {
	// Open closure
	// Local vars
	var Scroller, ajaxurl, stats, type, text, totop;

	// IE requires special handling
	var isIE = -1 != navigator.userAgent.search( 'MSIE' );
	if ( isIE ) {
		var IEVersion = navigator.userAgent.match( /MSIE\s?(\d+)\.?\d*;/ );
		IEVersion = parseInt( IEVersion[ 1 ] );
	}

	// HTTP ajaxurl when site is HTTPS causes Access-Control-Allow-Origin failure in Desktop and iOS Safari
	if ( 'https:' == document.location.protocol ) {
		infiniteScroll.settings.ajaxurl = infiniteScroll.settings.ajaxurl.replace(
			'http://',
			'https://'
		);
	}

	/**
	 * Loads new posts when users scroll near the bottom of the page.
	 */
	Scroller = function( settings ) {
		var self = this;

		// Initialize our variables
		this.id = settings.id;
		this.body = document.body;
		this.window = window;
		this.element = document.getElementById( settings.id );
		this.wrapperClass = settings.wrapper_class;
		this.ready = true;
		this.disabled = false;
		this.page = 1;
		this.offset = settings.offset;
		this.currentday = settings.currentday;
		this.order = settings.order;
		this.throttle = false;
		this.click_handle = settings.click_handle;
		this.google_analytics = settings.google_analytics;
		this.history = settings.history;
		this.origURL = window.location.href;
		this.pageCache = {};

		// Handle element
		this.handle = document.createElement( 'div' );
		this.handle.setAttribute( 'id', 'infinite-handle' );
		this.handle.innerHTML = '<span><button>' + text.replace( '\\', '' ) + '</button></span>';

		// Footer settings
		this.footer = {
			el: document.getElementById( 'infinite-footer' ),
			wrap: settings.footer,
		};

		// Bind methods used as callbacks
		this.checkViewportOnLoadBound = self.checkViewportOnLoad.bind( this );

		// Core's native MediaElement.js implementation needs special handling
		this.wpMediaelement = null;

		// We have two type of infinite scroll
		// cases 'scroll' and 'click'

		if ( type == 'scroll' ) {
			// Bind refresh to the scroll event
			// Throttle to check for such case every 300ms

			// On event the case becomes a fact
			this.window.addEventListener( 'scroll', function() {
				self.throttle = true;
			} );

			// Go back top method
			self.gotop();

			setInterval( function() {
				if ( self.throttle ) {
					// Once the case is the case, the action occurs and the fact is no more
					self.throttle = false;
					// Reveal or hide footer
					self.thefooter();
					// Fire the refresh
					self.refresh();
					self.determineURL(); // determine the url
				}
			}, 250 );

			// Ensure that enough posts are loaded to fill the initial viewport, to compensate for short posts and large displays.
			self.ensureFilledViewport();
			this.body.addEventListener( 'post-load', self.checkViewportOnLoadBound );
		} else if ( type == 'click' ) {
			if ( this.click_handle ) {
				this.element.appendChild( this.handle );
			}

			this.handle.addEventListener( 'click', function() {
				// Handle the handle
				if ( self.click_handle ) {
					self.handle.parentNode.removeChild( self.handle );
				}

				// Fire the refresh
				self.refresh();
			} );
		}

		// Initialize any Core audio or video players loaded via IS
		this.body.addEventListener( 'post-load', self.initializeMejs );
	};

	Scroller.prototype.triggerEvent = function( eventName, el, data ) {
		var e;

		try {
			var evtOptions = {
				bubbles: true,
				cancelable: true,
			};

			if ( data ) {
				evtOptions.detail = data;
			}
			e = new CustomEvent( eventName, evtOptions );
		} catch ( err ) {
			e = document.createEvent( 'CustomEvent' );
			e.initCustomEvent( eventName, true, true, data || null );
		}

		el.dispatchEvent( e );
	};

	/**
	 * Normalize the access to the document scrollTop value.
	 */
	Scroller.prototype.getScrollTop = function() {
		return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
	};

	/**
	 * Polyfill jQuery.extend.
	 */
	Scroller.prototype.extend = function( out ) {
		out = out || {};

		for ( var i = 1; i < arguments.length; i++ ) {
			if ( ! arguments[ i ] ) {
				continue;
			}

			for ( var key in arguments[ i ] ) {
				if ( arguments[ i ].hasOwnProperty( key ) ) {
					out[ key ] = arguments[ i ][ key ];
				}
			}
		}
		return out;
	};

	/**
	 * Check whether we should fetch any additional posts.
	 */
	Scroller.prototype.check = function() {
		var container = this.element.getBoundingClientRect();
		var top = container.top + this.getScrollTop();

		// If the container can't be found, stop otherwise errors result
		if ( 'object' !== typeof container ) {
			return false;
		}

		var bottom = this.getScrollTop() + this.window.innerHeight,
			threshold = top + this.element.offsetHeight - this.window.innerHeight * 2;

		return bottom > threshold;
	};

	/**
	 * Renders the results from a successful response.
	 */
	Scroller.prototype.render = function( response ) {
		this.body.classList.add( 'infinity-success' );

		// Check if we can wrap the html
		this.element.append( response.html );

		this.trigger( this.body.get( 0 ), 'is.post-load', {
			jqueryEventName: 'post-load',
			data: response,
		} );

		this.ready = true;
	};

	/**
	 * Returns the object used to query for new posts.
	 */
	Scroller.prototype.query = function() {
		return {
			page: this.page + this.offset, // Load the next page.
			currentday: this.currentday,
			order: this.order,
			scripts: window.infiniteScroll.settings.scripts,
			styles: window.infiniteScroll.settings.styles,
			query_args: window.infiniteScroll.settings.query_args,
			query_before: window.infiniteScroll.settings.query_before,
			last_post_date: window.infiniteScroll.settings.last_post_date,
		};
	};

	Scroller.prototype.animate = function( cb, duration ) {
		var start = performance.now();

		requestAnimationFrame( function animate( time ) {
			var timeFraction = Math.min( 1, ( time - start ) / duration );
			cb( timeFraction );

			if ( timeFraction < 1 ) {
				requestAnimationFrame( animate );
			}
		} );
	};

	/**
	 * Scroll back to top.
	 */
	Scroller.prototype.gotop = function() {
		var blog = document.getElementById( 'infinity-blog-title' );
		var self = this;

		blog.setAttribute( 'title', totop );
		blog.addEventListener( 'click', function( e ) {
			var sourceScroll = self.window.pageYOffset;
			e.preventDefault();

			self.animate( function( progress ) {
				var currentScroll = sourceScroll - sourceScroll * progress;
				document.documentElement.scrollTop = document.body.scrollTop = currentScroll;
			}, 200 );
		} );
	};

	/**
	 * The infinite footer.
	 */
	Scroller.prototype.thefooter = function() {
		var self = this,
			pageWrapper,
			footerContainer,
			width,
			sourceBottom,
			targetBottom;

		// Check if we have an id for the page wrapper
		if ( 'string' === typeof this.footer.wrap ) {
			try {
				pageWrapper = document.getElementById( this.footer.wrap );
				width = pageWrapper.getBoundingClientRect();
				width = width.width;
			} catch ( err ) {
				width = 0;
			}

			// Make the footer match the width of the page
			if ( width > 479 ) {
				footerContainer = this.footer.el.querySelector( '.container' );
				if ( footerContainer ) {
					footerContainer.style.width = width + 'px';
				}
			}
		}

		// Reveal footer
		sourceBottom = parseInt( self.footer.el.style.bottom || -50, 10 );
		targetBottom = this.window.pageYOffset >= 350 ? 0 : -50;

		if ( sourceBottom !== targetBottom ) {
			self.animate( function( progress ) {
				var currentBottom = sourceBottom + ( targetBottom - sourceBottom ) * progress;
				self.footer.el.style.bottom = currentBottom + 'px';

				if ( 1 === progress ) {
					sourceBottom = targetBottom;
				}
			}, 200 );
		}
	};

	/**
	 * Recursively convert a JS object into URL encoded data.
	 */
	Scroller.prototype.urlEncodeJSON = function( obj, prefix ) {
		var params = [],
			encodedKey,
			newPrefix;

		for ( var key in obj ) {
			encodedKey = encodeURIComponent( key );
			newPrefix = prefix ? prefix + '[' + encodedKey + ']' : encodedKey;

			if ( 'object' === typeof obj[ key ] ) {
				if ( ! Array.isArray( obj[ key ] ) || obj[ key ].length > 0 ) {
					params.push( this.urlEncodeJSON( obj[ key ], newPrefix ) );
				} else {
					// Explicitly expose empty arrays with no values
					params.push( newPrefix + '[]=' );
				}
			} else {
				params.push( newPrefix + '=' + encodeURIComponent( obj[ key ] ) );
			}
		}
		return params.join( '&' );
	};

	/**
	 * Controls the flow of the refresh. Don't mess.
	 */
	Scroller.prototype.refresh = function() {
		var self = this,
			query,
			xhr,
			loader,
			customized;

		// If we're disabled, ready, or don't pass the check, bail.
		if ( this.disabled || ! this.ready || ! this.check() ) {
			return;
		}

		// Let's get going -- set ready to false to prevent
		// multiple refreshes from occurring at once.
		this.ready = false;

		// Create a loader element to show it's working.
		if ( this.click_handle ) {
			if ( ! loader ) {
				loader = document.createElement( 'div' );
				loader.classList.add( 'infinite-loader' );
				loader.setAttribute( 'role', 'progress' );
				loader.innerHTML =
					'<div class="spinner"><div class="spinner-inner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>';
			}
			this.element.appendChild( loader );
		}

		// Generate our query vars.
		query = self.extend(
			{
				action: 'infinite_scroll',
			},
			this.query()
		);

		// Inject Customizer state.
		if ( 'undefined' !== typeof wp && wp.customize && wp.customize.settings.theme ) {
			customized = {};
			query.wp_customize = 'on';
			query.theme = wp.customize.settings.theme.stylesheet;
			wp.customize.each( function( setting ) {
				if ( setting._dirty ) {
					customized[ setting.id ] = setting();
				}
			} );
			query.customized = JSON.stringify( customized );
			query.nonce = wp.customize.settings.nonce.preview;
		}

		// Fire the ajax request.
		xhr = new XMLHttpRequest();
		xhr.open( 'POST', infiniteScroll.settings.ajaxurl, true );
		xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8' );
		xhr.send( self.urlEncodeJSON( query ) );

		// Allow refreshes to occur again if an error is triggered.
		xhr.onerror = function() {
			if ( self.click_handle ) {
				loader.parentNode.removeChild( loader );
			}

			self.ready = true;
		};

		// Success handler
		xhr.onload = function() {
			var response = JSON.parse( xhr.responseText ),
				httpCheck = xhr.status >= 200 && xhr.status < 300,
				responseCheck = 'undefined' !== typeof response.html;

			if ( ! response || ! httpCheck || ! responseCheck ) {
				return;
			}

			// On success, let's hide the loader circle.
			if ( self.click_handle ) {
				loader.parentNode.removeChild( loader );
			}

			// If additional scripts are required by the incoming set of posts, parse them
			if ( response.scripts && Array.isArray( response.scripts ) ) {
				response.scripts.forEach( function( item ) {
					var elementToAppendTo = item.footer ? 'body' : 'head';

					// Add script handle to list of those already parsed
					window.infiniteScroll.settings.scripts.push( item.handle );

					// Output extra data, if present
					if ( item.extra_data ) {
						var data = document.createElement( 'script' ),
							dataContent = document.createTextNode(
								'//<![CDATA[ \n' + item.extra_data + '\n//]]>'
							);

						data.type = 'text/javascript';
						data.appendChild( dataContent );

						document.getElementsByTagName( elementToAppendTo )[ 0 ].appendChild( data );
					}

					// Build script tag and append to DOM in requested location
					var script = document.createElement( 'script' );
					script.type = 'text/javascript';
					script.src = item.src;
					script.id = item.handle;

					// Dynamically loaded scripts are async by default.
					// We don't want that, it breaks stuff, e.g. wp-mediaelement init.
					script.async = false;

					// If MediaElement.js is loaded in by item set of posts, don't initialize the players a second time as it breaks them all
					if ( 'wp-mediaelement' === item.handle ) {
						self.body.removeEventListener( 'post-load', self.initializeMejs );
					}

					if ( 'wp-mediaelement' === item.handle && 'undefined' === typeof mejs ) {
						self.wpMediaelement = {};
						self.wpMediaelement.tag = script;
						self.wpMediaelement.element = elementToAppendTo;
						setTimeout( self.maybeLoadMejs.bind( self ), 250 );
					} else {
						document.getElementsByTagName( elementToAppendTo )[ 0 ].appendChild( script );
					}
				} );
			}

			// If additional stylesheets are required by the incoming set of posts, parse them
			if ( response.styles && Array.isArray( response.styles ) ) {
				response.styles.forEach( function( item ) {
					// Add stylesheet handle to list of those already parsed
					window.infiniteScroll.settings.styles.push( item.handle );

					// Build link tag
					var style = document.createElement( 'link' );
					style.rel = 'stylesheet';
					style.href = item.src;
					style.id = item.handle + '-css';

					// Destroy link tag if a conditional statement is present and either the browser isn't IE, or the conditional doesn't evaluate true
					if (
						item.conditional &&
						( ! isIE || ! eval( item.conditional.replace( /%ver/g, IEVersion ) ) )
					) {
						style = false;
					}

					// Append link tag if necessary
					if ( style ) {
						document.getElementsByTagName( 'head' )[ 0 ].appendChild( style );
					}
				} );
			}

			// stash the response in the page cache
			self.pageCache[ self.page + self.offset ] = response;

			// Increment the page number
			self.page++;

			// Record pageview in WP Stats, if available.
			if ( stats ) {
				new Image().src =
					document.location.protocol +
					'//pixel.wp.com/g.gif?' +
					stats +
					'&post=0&baba=' +
					Math.random();
			}

			// Add new posts to the postflair object
			if ( 'object' === typeof response.postflair && 'object' === typeof WPCOM_sharing_counts ) {
				WPCOM_sharing_counts = self.extend( WPCOM_sharing_counts, response.postflair ); // eslint-disable-line no-global-assign
			}

			// Render the results
			self.render.call( self, response );

			// If 'click' type and there are still posts to fetch, add back the handle
			if ( type == 'click' ) {
				if ( response.lastbatch ) {
					if ( self.click_handle ) {
						// Update body classes
						self.body.classList.add( 'infinity-end' );
						self.body.classList.remove( 'infinity-success' );
					} else {
						self.triggerEvent( 'infinite-scroll-posts-end', this.body, null );
					}
				} else {
					if ( self.click_handle ) {
						self.element.appendChild( self.handle );
					} else {
						self.triggerEvent( 'infinite-scroll-posts-more', this.body, null );
					}
				}
			} else if ( response.lastbatch ) {
				self.disabled = true;

				self.body.classList.add( 'infinity-end' );
				self.body.classList.remove( 'infinity-success' );
			}

			// Update currentday to the latest value returned from the server
			if ( response.currentday ) {
				self.currentday = response.currentday;
			}

			// Fire Google Analytics pageview
			if ( self.google_analytics ) {
				var ga_url = self.history.path.replace( /%d/, self.page );
				if ( 'object' === typeof _gaq ) {
					_gaq.push( [ '_trackPageview', ga_url ] );
				}
				if ( 'function' === typeof ga ) {
					ga( 'send', 'pageview', ga_url );
				}
			}
		};

		return xhr;
	};

	/**
	 * Core's native media player uses MediaElement.js
	 * The library's size is sufficient that it may not be loaded in time for Core's helper to invoke it, so we need to delay until `mejs` exists.
	 */
	Scroller.prototype.maybeLoadMejs = function() {
		if ( null === this.wpMediaelement ) {
			return;
		}

		if ( 'undefined' === typeof mejs ) {
			setTimeout( this.maybeLoadMejs.bind( this ), 250 );
		} else {
			document
				.getElementsByTagName( this.wpMediaelement.element )[ 0 ]
				.appendChild( this.wpMediaelement.tag );
			this.wpMediaelement = null;

			// Ensure any subsequent IS loads initialize the players
			this.body.addEventListener( 'post-load', this.initializeMejs );
		}
	};

	/**
	 * Initialize the MediaElement.js player for any posts not previously initialized
	 */
	Scroller.prototype.initializeMejs = function( e ) {
		// Are there media players in the incoming set of posts?
		if (
			! e.detail ||
			! e.detail.html ||
			( -1 === e.detail.html.indexOf( 'wp-audio-shortcode' ) &&
				-1 === e.detail.html.indexOf( 'wp-video-shortcode' ) )
		) {
			return;
		}

		// Don't bother if mejs isn't loaded for some reason
		if ( 'undefined' === typeof mejs ) {
			return;
		}

		// Adapted from wp-includes/js/mediaelement/wp-mediaelement.js
		// Modified to not initialize already-initialized players, as Mejs doesn't handle that well
		var settings = {};
		var audioVideoElements;

		if ( typeof _wpmejsSettings !== 'undefined' ) {
			settings.pluginPath = _wpmejsSettings.pluginPath;
		}

		settings.success = function( mejs ) {
			var autoplay = mejs.attributes.autoplay && 'false' !== mejs.attributes.autoplay;
			if ( 'flash' === mejs.pluginType && autoplay ) {
				mejs.addEventListener(
					'canplay',
					function() {
						mejs.play();
					},
					false
				);
			}
		};

		audioVideoElements = document.querySelectorAll( '.wp-audio-shortcode, .wp-video-shortcode' );
		audioVideoElements = Array.prototype.slice.call( audioVideoElements );

		// Only process already unprocessed shortcodes.
		audioVideoElements = audioVideoElements.filter( function( el ) {
			while ( el.parentNode ) {
				if ( el.classList.contains( 'mejs-container' ) ) {
					return false;
				}
				el = el.parentNode;
			}
			return true;
		} );

		for ( var i = 0; i < audioVideoElements.length; i++ ) {
			new MediaElementPlayer( audioVideoElements[ i ], settings );
		}
	};

	/**
	 * Trigger IS to load additional posts if the initial posts don't fill the window.
	 * On large displays, or when posts are very short, the viewport may not be filled with posts, so we overcome this by loading additional posts when IS initializes.
	 */
	Scroller.prototype.ensureFilledViewport = function() {
		var self = this,
			windowHeight = self.window.innerHeight,
			postsHeight = self.element.offsetHeight,
			aveSetHeight = 0,
			wrapperQty = 0,
			elChildNodes = self.element.childNodes,
			wrapperEls = document.querySelectorAll( '.' + self.wrapperClass ),
			i;

		// Account for situations where postsHeight is 0 because child list elements are floated
		if ( postsHeight === 0 ) {
			for ( i = 0; elChildNodes.length; i++ ) {
				postsHeight += elChildNodes[ i ].offsetHeight;
			}

			if ( postsHeight === 0 ) {
				self.body.addEventListener( 'post-load', self.checkViewportOnLoadBound );
				return;
			}
		}

		// Calculate average height of a set of posts to prevent more posts than needed from being loaded.
		for ( i = 0; i < wrapperEls.length; i++ ) {
			aveSetHeight += wrapperEls[ i ].offsetHeight;
			wrapperQty++;
		}

		if ( wrapperQty > 0 ) {
			aveSetHeight = aveSetHeight / wrapperQty;
		} else {
			aveSetHeight = 0;
		}

		// Load more posts if space permits, otherwise stop checking for a full viewport
		if ( postsHeight < windowHeight && postsHeight + aveSetHeight < windowHeight ) {
			self.ready = true;
			self.refresh();
		} else {
			self.body.addEventListener( 'post-load', self.checkViewportOnLoadBound );
		}
	};

	/**
	 * Event handler for ensureFilledViewport(), tied to the post-load trigger.
	 * Necessary to ensure that the variable `this` contains the scroller when used in ensureFilledViewport(). Since this function is tied to an event, `this` becomes the DOM element the event is tied to.
	 */
	Scroller.prototype.checkViewportOnLoad = function() {
		this.ensureFilledViewport();
	};

	function fullscreenState() {
		return document.fullscreenElement ||
			document.mozFullScreenElement ||
			document.webkitFullscreenElement ||
			document.msFullscreenElement
			? 1
			: 0;
	}

	var previousFullScrenState = fullscreenState();

	/**
	 * Identify archive page that corresponds to majority of posts shown in the current browser window.
	 */
	Scroller.prototype.determineURL = function() {
		var self = this,
			windowTop = self.getScrollTop(),
			windowBottom = windowTop + this.window.innerHeight,
			windowSize = windowBottom - windowTop,
			setsInView = [],
			setsHidden = [],
			pageNum = false,
			currentFullScreenState = fullscreenState(),
			wrapperEls;

		// xor - check if the state has changed
		if ( previousFullScrenState ^ currentFullScreenState ) {
			// If we just switched to/from fullscreen,
			// don't do the div clearing/caching or the
			// URL setting. Doing so can break video playback
			// if the video goes to fullscreen.

			previousFullScrenState = currentFullScreenState;
			return;
		}
		previousFullScrenState = currentFullScreenState;

		wrapperEls = document.querySelectorAll( '.' + self.wrapperClass );
		for ( var i = 0; i < wrapperEls.length; i++ ) {
			var id = wrapperEls[ i ].getAttribute( 'id' ),
				setTop,
				setHeight = wrapperEls[ i ].offsetHeight,
				setBottom = 0,
				setPageNum = wrapperEls[ i ].dataset.pageNum;

			setTop = wrapperEls[ i ].getBoundingClientRect();
			setTop = setTop.top + self.getScrollTop();

			// Account for containers that have no height because their children are floated elements.
			if ( 0 === setHeight ) {
				for ( var j = 0; j < wrapperEls[ i ].childNodes.length; j++ ) {
					setHeight += wrapperEls[ i ].childNodes[ j ].offsetHeight;
				}
			}

			// Determine position of bottom of set by adding its height to the scroll position of its top.
			setBottom = setTop + setHeight;

			// Populate setsInView object. While this logic could all be combined into a single conditional statement, this is easier to understand.
			if ( setTop < windowTop && setBottom > windowBottom ) {
				// top of set is above window, bottom is below
				setsInView.push( { id: id, top: setTop, bottom: setBottom, pageNum: setPageNum } );
			} else if ( setTop > windowTop && setTop < windowBottom ) {
				// top of set is between top (gt) and bottom (lt)
				setsInView.push( { id: id, top: setTop, bottom: setBottom, pageNum: setPageNum } );
			} else if ( setBottom > windowTop && setBottom < windowBottom ) {
				// bottom of set is between top (gt) and bottom (lt)
				setsInView.push( { id: id, top: setTop, bottom: setBottom, pageNum: setPageNum } );
			} else {
				setsHidden.push( { id: id, top: setTop, bottom: setBottom, pageNum: setPageNum } );
			}
		}

		setsHidden.forEach( function( set ) {
			var setEl = document.getElementById( set.id );

			if ( setEl.classList.contains( 'is--replaced' ) ) {
				return;
			}
			self.pageCache[ set.pageNum ].html = setEl.innerHTML;

			setEl.style.minHeight = set.bottom - set.top + 'px';
			setEl.classList.add( 'is--replaced' );

			while ( setEl.firstChild ) {
				setEl.removeChild( setEl.firstChild );
			}
		} );

		setsInView.forEach( function( set ) {
			var setEl = document.getElementById( set.id );

			if ( setEl.classList.contains( 'is--replaced' ) ) {
				setEl.style.minHeight = '';
				setEl.classList.remove( 'is--replaced' );

				if ( this.pageNum in self.pageCache ) {
					$set.html( self.pageCache[ this.pageNum ].html );
					self.trigger( self.body.get( 0 ), 'is.post-load', {
						jqueryEventName: 'post-load',
						data: self.pageCache[ this.pageNum ],
					} );
				}
			}
		} );

		// Parse number of sets found in view in an attempt to update the URL to match the set that comprises the majority of the window.
		if ( 0 == setsInView.length ) {
			pageNum = -1;
		} else if ( 1 == setsInView.length ) {
			var setData = setsInView.pop();

			// If the first set of IS posts is in the same view as the posts loaded in the template by WordPress, determine how much of the view is comprised of IS-loaded posts
			if ( ( windowBottom - setData.top ) / windowSize < 0.5 ) {
				pageNum = -1;
			} else {
				pageNum = setData.pageNum;
			}
		} else {
			var majorityPercentageInView = 0;

			// Identify the IS set that comprises the majority of the current window and set the URL to it.
			setsInView.forEach( function( setData ) {
				var topInView = 0,
					bottomInView = 0,
					percentOfView = 0;

				// Figure percentage of view the current set represents
				if ( setData.top > windowTop && setData.top < windowBottom ) {
					topInView = ( windowBottom - setData.top ) / windowSize;
				}

				if ( setData.bottom > windowTop && setData.bottom < windowBottom ) {
					bottomInView = ( setData.bottom - windowTop ) / windowSize;
				}

				// Figure out largest percentage of view for current set
				if ( topInView >= bottomInView ) {
					percentOfView = topInView;
				} else if ( bottomInView >= topInView ) {
					percentOfView = bottomInView;
				}

				// Does current set's percentage of view supplant the largest previously-found set?
				if ( percentOfView > majorityPercentageInView ) {
					pageNum = setData.pageNum;
					majorityPercentageInView = percentOfView;
				}
			} );
		}

		// If a page number could be determined, update the URL
		// -1 indicates that the original requested URL should be used.
		pageNum = parseInt( pageNum, 10 );
		if ( pageNum ) {
			self.updateURL( pageNum );
		}
	};

	/**
	 * Update address bar to reflect archive page URL for a given page number.
	 * Checks if URL is different to prevent pollution of browser history.
	 */
	Scroller.prototype.updateURL = function( page ) {
		// IE only supports pushState() in v10 and above, so don't bother if those conditions aren't met.
		if ( ! window.history.pushState ) {
			return;
		}
		var self = this,
			pageSlug = self.origURL;

		if ( -1 !== page ) {
			pageSlug =
				window.location.protocol +
				'//' +
				self.history.host +
				self.history.path.replace( /%d/, page ) +
				self.history.parameters;
		}

		if ( window.location.href != pageSlug ) {
			history.pushState( null, null, pageSlug );
		}
	};

	/**
	 * Pause scrolling.
	 */
	Scroller.prototype.pause = function() {
		this.disabled = true;
	};

	/**
	 * Resume scrolling.
	 */
	Scroller.prototype.resume = function() {
		this.disabled = false;
	};

	/**
	 * Emits custom JS events.
	 *
	 * @param {Node}   el
	 * @param {string} eventName
	 * @param {*}      data
	 */
	Scroller.prototype.trigger = function( el, eventName, opts ) {
		opts = opts || {};

		/**
		 * Emit the event in a jQuery way for backwards compatibility where necessary.
		 */
		if ( opts.jqueryEventName && 'undefined' !== typeof jQuery ) {
			jQuery( el ).trigger( opts.jqueryEventName, opts.data || null );
		}

		/**
		 * Emit the event in a standard way.
		 */
		var e;
		try {
			e = new CustomEvent( eventName, {
				bubbles: true,
				cancelable: true,
				detail: opts.data || null,
			} );
		} catch ( err ) {
			e = document.createEvent( 'CustomEvent' );
			e.initCustomEvent( eventName, true, true, opts.data || null );
		}
		el.dispatchEvent( e );
	};

	/**
	 * Ready, set, go!
	 */
	var jetpackInfinityModule = function() {
		var bodyClasses = infiniteScroll.settings.body_class.split( ' ' );

		// Check for our variables
		if ( 'object' !== typeof infiniteScroll ) {
			return;
		}

		bodyClasses.forEach( function( className ) {
			if ( className ) {
				document.body.classList.add( className );
			}
		} );

		// Set ajaxurl (for brevity)
		ajaxurl = infiniteScroll.settings.ajaxurl;

		// Set stats, used for tracking stats
		stats = infiniteScroll.settings.stats;

		// Define what type of infinity we have, grab text for click-handle
		type = infiniteScroll.settings.type;
		text = infiniteScroll.settings.text;
		totop = infiniteScroll.settings.totop;

		// Initialize the scroller (with the ID of the element from the theme)
		infiniteScroll.scroller = new Scroller( infiniteScroll.settings );

		/**
		 * Monitor user scroll activity to update URL to correspond to archive page for current set of IS posts
		 */
		if ( type == 'click' ) {
			var timer = null;
			window.addEventListener( 'scroll', function() {
				// run the real scroll handler once every 250 ms.
				if ( timer ) {
					return;
				}
				timer = setTimeout( function() {
					infiniteScroll.scroller.determineURL();
					timer = null;
				}, 250 );
			} );
		}
	};

	/**
	 * Ready, set, go!
	 */
	if ( document.readyState === 'interactive' || document.readyState === 'complete' ) {
		jetpackInfinityModule();
	} else {
		document.addEventListener( 'DOMContentLoaded', jetpackInfinityModule );
	}
} )(); // Close closure
