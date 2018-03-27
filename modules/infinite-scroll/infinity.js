(function($){ // Open closure
// Local vars
var Scroller, ajaxurl, stats, type, text, totop;

// IE requires special handling
var isIE = ( -1 != navigator.userAgent.search( 'MSIE' ) );
if ( isIE ) {
	var IEVersion = navigator.userAgent.match(/MSIE\s?(\d+)\.?\d*;/);
	var IEVersion = parseInt( IEVersion[1] );
}

// HTTP ajaxurl when site is HTTPS causes Access-Control-Allow-Origin failure in Desktop and iOS Safari
if ( "https:" == document.location.protocol ) {
	infiniteScroll.settings.ajaxurl = infiniteScroll.settings.ajaxurl.replace( "http://", "https://" );
}

/**
 * Loads new posts when users scroll near the bottom of the page.
 */
Scroller = function( settings ) {
	var self = this;

	// Initialize our variables
	this.id               = settings.id;
	this.body             = $( document.body );
	this.window           = $( window );
	this.element          = $( '#' + settings.id );
	this.wrapperClass     = settings.wrapper_class;
	this.ready            = true;
	this.disabled         = false;
	this.page             = 1;
	this.offset           = settings.offset;
	this.currentday       = settings.currentday;
	this.order            = settings.order;
	this.throttle         = false;
	this.handle           = '<div id="infinite-handle"><span><button>' + text.replace( '\\', '' ) + '</button></span></div>';
	this.click_handle     = settings.click_handle;
	this.google_analytics = settings.google_analytics;
	this.history          = settings.history;
	this.origURL          = window.location.href;
	this.pageCache        = {};

	// Footer settings
	this.footer           = $( '#infinite-footer' );
	this.footer.wrap      = settings.footer;

	// Core's native MediaElement.js implementation needs special handling
	this.wpMediaelement   = null;

	// We have two type of infinite scroll
	// cases 'scroll' and 'click'

	if ( type == 'scroll' ) {
		// Bind refresh to the scroll event
		// Throttle to check for such case every 300ms

		// On event the case becomes a fact
		this.window.bind( 'scroll.infinity', function() {
			this.throttle = true;
		});

		// Go back top method
		self.gotop();

		setInterval( function() {
			if ( this.throttle ) {
				// Once the case is the case, the action occurs and the fact is no more
				this.throttle = false;
				// Reveal or hide footer
				self.thefooter();
				// Fire the refresh
				self.refresh();
                self.determineURL(); // determine the url 
			}
		}, 250 );

		// Ensure that enough posts are loaded to fill the initial viewport, to compensate for short posts and large displays.
		self.ensureFilledViewport();
		this.body.bind( 'post-load', { self: self }, self.checkViewportOnLoad );
	} else if ( type == 'click' ) {
		if ( this.click_handle ) {
			this.element.append( this.handle );
		}

		this.body.delegate( '#infinite-handle', 'click.infinity', function() {
			// Handle the handle
			if ( self.click_handle ) {
				$( '#infinite-handle' ).remove();
			}

			// Fire the refresh
			self.refresh();
		});
	}

	// Initialize any Core audio or video players loaded via IS
	this.body.bind( 'post-load', { self: self }, self.initializeMejs );
};

/**
 * Check whether we should fetch any additional posts.
 */
Scroller.prototype.check = function() {
	var container = this.element.offset();

	// If the container can't be found, stop otherwise errors result
	if ( 'object' !== typeof container ) {
		return false;
	}

	var bottom = this.window.scrollTop() + this.window.height(),
		threshold = container.top + this.element.outerHeight(false) - (this.window.height() * 2);

	return bottom > threshold;
};

/**
 * Renders the results from a successful response.
 */
Scroller.prototype.render = function( response ) {
	this.body.addClass( 'infinity-success' );

	// Check if we can wrap the html
	this.element.append( response.html );
	this.body.trigger( 'post-load', response );
	this.ready = true;
};

/**
 * Returns the object used to query for new posts.
 */
Scroller.prototype.query = function() {
	return {
		page           : this.page + this.offset, // Load the next page.
		currentday     : this.currentday,
		order          : this.order,
		scripts        : window.infiniteScroll.settings.scripts,
		styles         : window.infiniteScroll.settings.styles,
		query_args     : window.infiniteScroll.settings.query_args,
		last_post_date : window.infiniteScroll.settings.last_post_date
	};
};

/**
 * Scroll back to top.
 */
Scroller.prototype.gotop = function() {
	var blog = $( '#infinity-blog-title' );

	blog.attr( 'title', totop );

	// Scroll to top on blog title
	blog.bind( 'click', function( e ) {
		$( 'html, body' ).animate( { scrollTop: 0 }, 'fast' );
		e.preventDefault();
	});
};


/**
 * The infinite footer.
 */
Scroller.prototype.thefooter = function() {
	var self  = this,
		width;

	// Check if we have an id for the page wrapper
	if ( $.type( this.footer.wrap ) === "string" ) {
		width = $( 'body #' + this.footer.wrap ).outerWidth( false );

		// Make the footer match the width of the page
		if ( width > 479 )
			this.footer.find( '.container' ).css( 'width', width );
	}

	// Reveal footer
	if ( this.window.scrollTop() >= 350 )
		self.footer.animate( { 'bottom': 0 }, 'fast' );
	else if ( this.window.scrollTop() < 350 )
		self.footer.animate( { 'bottom': '-50px' }, 'fast' );
};


/**
 * Controls the flow of the refresh. Don't mess.
 */
Scroller.prototype.refresh = function() {
	var	self   = this,
		query, jqxhr, load, loader, color, customized;

	// If we're disabled, ready, or don't pass the check, bail.
	if ( this.disabled || ! this.ready || ! this.check() )
		return;

	// Let's get going -- set ready to false to prevent
	// multiple refreshes from occurring at once.
	this.ready = false;

	// Create a loader element to show it's working.
	if ( this.click_handle ) {
		loader = '<span class="infinite-loader"></span>';
		this.element.append( loader );

		loader = this.element.find( '.infinite-loader' );
		color = loader.css( 'color' );

		try {
			loader.spin( 'medium-left', color );
		} catch ( error ) { }
	}

	// Generate our query vars.
	query = $.extend({
		action: 'infinite_scroll'
	}, this.query() );

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
	jqxhr = $.post( infiniteScroll.settings.ajaxurl, query );

	// Allow refreshes to occur again if an error is triggered.
	jqxhr.fail( function() {
		if ( self.click_handle ) {
			loader.hide();
		}

		self.ready = true;
	});

	// Success handler
	jqxhr.done( function( response ) {
			// On success, let's hide the loader circle.
			if ( self.click_handle ) {
				loader.hide();
			}

			// Check for and parse our response.
			if ( ! response || ! response.type ) {
				return;
			}

			// If we've succeeded...
			if ( response.type == 'success' ) {
				// If additional scripts are required by the incoming set of posts, parse them
				if ( response.scripts ) {
					$( response.scripts ).each( function() {
						var elementToAppendTo = this.footer ? 'body' : 'head';

						// Add script handle to list of those already parsed
						window.infiniteScroll.settings.scripts.push( this.handle );

						// Output extra data, if present
						if ( this.extra_data ) {
							var data = document.createElement('script'),
								dataContent = document.createTextNode( "//<![CDATA[ \n" + this.extra_data + "\n//]]>" );

							data.type = 'text/javascript';
							data.appendChild( dataContent );

							document.getElementsByTagName( elementToAppendTo )[0].appendChild(data);
						}

						// Build script tag and append to DOM in requested location
						var script = document.createElement('script');
						script.type = 'text/javascript';
						script.src = this.src;
						script.id = this.handle;

						// If MediaElement.js is loaded in by this set of posts, don't initialize the players a second time as it breaks them all
						if ( 'wp-mediaelement' === this.handle ) {
							self.body.unbind( 'post-load', self.initializeMejs );
						}

						if ( 'wp-mediaelement' === this.handle && 'undefined' === typeof mejs ) {
							self.wpMediaelement = {};
							self.wpMediaelement.tag = script;
							self.wpMediaelement.element = elementToAppendTo;
							setTimeout( self.maybeLoadMejs.bind( self ), 250 );
						} else {
							document.getElementsByTagName( elementToAppendTo )[0].appendChild(script);
						}
					} );
				}

				// If additional stylesheets are required by the incoming set of posts, parse them
				if ( response.styles ) {
					$( response.styles ).each( function() {
						// Add stylesheet handle to list of those already parsed
						window.infiniteScroll.settings.styles.push( this.handle );

						// Build link tag
						var style = document.createElement('link');
						style.rel = 'stylesheet';
						style.href = this.src;
						style.id = this.handle + '-css';

						// Destroy link tag if a conditional statement is present and either the browser isn't IE, or the conditional doesn't evaluate true
						if ( this.conditional && ( ! isIE || ! eval( this.conditional.replace( /%ver/g, IEVersion ) ) ) )
							var style = false;

						// Append link tag if necessary
						if ( style )
							document.getElementsByTagName('head')[0].appendChild(style);
					} );
				}

				// stash the response in the page cache
				self.pageCache[self.page+self.offset] = response;

				// Increment the page number
				self.page++;

				// Record pageview in WP Stats, if available.
				if ( stats )
					new Image().src = document.location.protocol + '//pixel.wp.com/g.gif?' + stats + '&post=0&baba=' + Math.random();

				// Add new posts to the postflair object
				if ( 'object' == typeof response.postflair && 'object' == typeof WPCOM_sharing_counts )
					WPCOM_sharing_counts = $.extend( WPCOM_sharing_counts, response.postflair );

				// Render the results
				self.render.apply( self, arguments );

				// If 'click' type and there are still posts to fetch, add back the handle
				if ( type == 'click' ) {
					if ( response.lastbatch ) {
						if ( self.click_handle ) {
							$( '#infinite-handle' ).remove();
							// Update body classes
							self.body.addClass( 'infinity-end' ).removeClass( 'infinity-success' );
						} else {
							self.body.trigger( 'infinite-scroll-posts-end' );
						}
					} else {
						if ( self.click_handle ) {
							self.element.append( self.handle );
						} else {
							self.body.trigger( 'infinite-scroll-posts-more' );
						}
					}
				} else if ( response.lastbatch ) {
					self.disabled = true;
					self.body.addClass( 'infinity-end' ).removeClass( 'infinity-success' );
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
			}
		});

	return jqxhr;
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
		setTimeout( this.maybeLoadMejs, 250 );
	} else {
		document.getElementsByTagName( this.wpMediaelement.element )[0].appendChild( this.wpMediaelement.tag );
		this.wpMediaelement = null;

		// Ensure any subsequent IS loads initialize the players
		this.body.bind( 'post-load', { self: this }, this.initializeMejs );
	}
}

/**
 * Initialize the MediaElement.js player for any posts not previously initialized
 */
Scroller.prototype.initializeMejs = function( ev, response ) {
	// Are there media players in the incoming set of posts?
	if ( ! response.html || -1 === response.html.indexOf( 'wp-audio-shortcode' ) && -1 === response.html.indexOf( 'wp-video-shortcode' ) ) {
		return;
	}

	// Don't bother if mejs isn't loaded for some reason
	if ( 'undefined' === typeof mejs ) {
		return;
	}

	// Adapted from wp-includes/js/mediaelement/wp-mediaelement.js
	// Modified to not initialize already-initialized players, as Mejs doesn't handle that well
	$(function () {
		var settings = {};

		if ( typeof _wpmejsSettings !== 'undefined' ) {
			settings.pluginPath = _wpmejsSettings.pluginPath;
		}

		settings.success = function (mejs) {
			var autoplay = mejs.attributes.autoplay && 'false' !== mejs.attributes.autoplay;
			if ( 'flash' === mejs.pluginType && autoplay ) {
				mejs.addEventListener( 'canplay', function () {
					mejs.play();
				}, false );
			}
		};

		$('.wp-audio-shortcode, .wp-video-shortcode').not( '.mejs-container' ).mediaelementplayer( settings );
	});
}

/**
 * Trigger IS to load additional posts if the initial posts don't fill the window.
 * On large displays, or when posts are very short, the viewport may not be filled with posts, so we overcome this by loading additional posts when IS initializes.
 */
Scroller.prototype.ensureFilledViewport = function() {
	var	self = this,
	   	windowHeight = self.window.height(),
	   	postsHeight = self.element.height(),
	   	aveSetHeight = 0,
	   	wrapperQty = 0;

	// Account for situations where postsHeight is 0 because child list elements are floated
	if ( postsHeight === 0 ) {
		$( self.element.selector + ' > li' ).each( function() {
			postsHeight += $( this ).height();
		} );

		if ( postsHeight === 0 ) {
			self.body.unbind( 'post-load', self.checkViewportOnLoad );
			return;
		}
	}

	// Calculate average height of a set of posts to prevent more posts than needed from being loaded.
	$( '.' + self.wrapperClass ).each( function() {
		aveSetHeight += $( this ).height();
		wrapperQty++;
	} );

	if ( wrapperQty > 0 )
		aveSetHeight = aveSetHeight / wrapperQty;
	else
		aveSetHeight = 0;

	// Load more posts if space permits, otherwise stop checking for a full viewport
	if ( postsHeight < windowHeight && ( postsHeight + aveSetHeight < windowHeight ) ) {
		self.ready = true;
		self.refresh();
	}
	else {
		self.body.unbind( 'post-load', self.checkViewportOnLoad );
	}
}

/**
 * Event handler for ensureFilledViewport(), tied to the post-load trigger.
 * Necessary to ensure that the variable `this` contains the scroller when used in ensureFilledViewport(). Since this function is tied to an event, `this` becomes the DOM element the event is tied to.
 */
Scroller.prototype.checkViewportOnLoad = function( ev ) {
	ev.data.self.ensureFilledViewport();
}

/**
 * Identify archive page that corresponds to majority of posts shown in the current browser window.
 */
Scroller.prototype.determineURL = function () {
	var self         = this,
		windowTop    = $( window ).scrollTop(),
		windowBottom = windowTop + $( window ).height(),
		windowSize   = windowBottom - windowTop,
		setsInView   = [],
		setsHidden   = [],
		pageNum      = false;

	// Find out which sets are in view
	$( '.' + self.wrapperClass ).each( function() {
		var id         = $( this ).attr( 'id' ),
			setTop     = $( this ).offset().top,
			setHeight  = $( this ).outerHeight( false ),
			setBottom  = 0,
			setPageNum = $( this ).data( 'page-num' );

		// Account for containers that have no height because their children are floated elements.
		if ( 0 === setHeight ) {
			$( '> *', this ).each( function() {
				setHeight += $( this ).outerHeight( false );
			} );
		}

		// Determine position of bottom of set by adding its height to the scroll position of its top.
		setBottom = setTop + setHeight;

		// Populate setsInView object. While this logic could all be combined into a single conditional statement, this is easier to understand.
		if ( setTop < windowTop && setBottom > windowBottom ) { // top of set is above window, bottom is below
			setsInView.push({'id': id, 'top': setTop, 'bottom': setBottom, 'pageNum': setPageNum });
		}
		else if( setTop > windowTop && setTop < windowBottom ) { // top of set is between top (gt) and bottom (lt)
			setsInView.push({'id': id, 'top': setTop, 'bottom': setBottom, 'pageNum': setPageNum });
		}
		else if( setBottom > windowTop && setBottom < windowBottom ) { // bottom of set is between top (gt) and bottom (lt)
			setsInView.push({'id': id, 'top': setTop, 'bottom': setBottom, 'pageNum': setPageNum });
		} else {
			setsHidden.push({'id': id, 'top': setTop, 'bottom': setBottom, 'pageNum': setPageNum });
		}
	} );

	$.each(setsHidden, function() {
		var $set = $('#' + this.id);
		if( $set.hasClass( 'is--replaced' ) ) {
			return;
		}

	        self.pageCache[ this.pageNum].html = $set.html();

		$set.css('min-height', ( this.bottom - this.top ) + 'px' )
		    .addClass('is--replaced')
		    .empty();
	});

	$.each(setsInView, function() {
		var $set = $('#' + this.id);

		if( $set.hasClass('is--replaced') ) {
			$set.css('min-height', '').removeClass('is--replaced');
			if( this.pageNum in self.pageCache ) {
				$set.html( self.pageCache[this.pageNum].html );
		        	self.body.trigger( 'post-load', self.pageCache[this.pageNum] );
			}
		}

	});

	// Parse number of sets found in view in an attempt to update the URL to match the set that comprises the majority of the window.
	if ( 0 == setsInView.length ) {
		pageNum = -1;
	}
	else if ( 1 == setsInView.length ) {
		var setData = setsInView.pop();

		// If the first set of IS posts is in the same view as the posts loaded in the template by WordPress, determine how much of the view is comprised of IS-loaded posts
		if ( ( ( windowBottom - setData.top ) / windowSize ) < 0.5 )
			pageNum = -1;
		else
			pageNum = setData.pageNum;
	}
	else {
		var majorityPercentageInView = 0;

		// Identify the IS set that comprises the majority of the current window and set the URL to it.
		$.each( setsInView, function( i, setData ) {
			var topInView     = 0,
				bottomInView  = 0,
				percentOfView = 0;

			// Figure percentage of view the current set represents
			if ( setData.top > windowTop && setData.top < windowBottom )
				topInView = ( windowBottom - setData.top ) / windowSize;

			if ( setData.bottom > windowTop && setData.bottom < windowBottom )
				bottomInView = ( setData.bottom - windowTop ) / windowSize;

			// Figure out largest percentage of view for current set
			if ( topInView >= bottomInView )
				percentOfView = topInView;
			else if ( bottomInView >= topInView )
				percentOfView = bottomInView;

			// Does current set's percentage of view supplant the largest previously-found set?
			if ( percentOfView > majorityPercentageInView ) {
				pageNum = setData.pageNum;
				majorityPercentageInView = percentOfView;
			}
		} );
	}

	// If a page number could be determined, update the URL
	// -1 indicates that the original requested URL should be used.
	if ( 'number' == typeof pageNum ) {
		self.updateURL( pageNum );
	}
}

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
		pageSlug = -1 == page ? self.origURL : window.location.protocol + '//' + self.history.host + self.history.path.replace( /%d/, page ) + self.history.parameters;

	if ( window.location.href != pageSlug ) {
		history.pushState( null, null, pageSlug );
	}
}

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
 * Ready, set, go!
 */
$( document ).ready( function() {
	// Check for our variables
	if ( 'object' != typeof infiniteScroll )
		return;

	$( document.body ).addClass( infiniteScroll.settings.body_class );

	// Set ajaxurl (for brevity)
	ajaxurl = infiniteScroll.settings.ajaxurl;

	// Set stats, used for tracking stats
	stats = infiniteScroll.settings.stats;

	// Define what type of infinity we have, grab text for click-handle
	type  = infiniteScroll.settings.type;
	text  = infiniteScroll.settings.text;
	totop = infiniteScroll.settings.totop;

	// Initialize the scroller (with the ID of the element from the theme)
	infiniteScroll.scroller = new Scroller( infiniteScroll.settings );

	/**
	 * Monitor user scroll activity to update URL to correspond to archive page for current set of IS posts
	 */
    if( type == 'click' ) {
        var timer = null;
        $( window ).bind( 'scroll', function() {
            // run the real scroll handler once every 250 ms.
            if ( timer ) { return; }
            timer = setTimeout( function() {
                infiniteScroll.scroller.determineURL();
                timer = null;
            } , 250 );
        });
    }

	// Integrate with Selective Refresh in the Customizer.
	if ( 'undefined' !== typeof wp && wp.customize && wp.customize.selectiveRefresh ) {

		/**
		 * Handle rendering of selective refresh partials.
		 *
		 * Make sure that when a partial is rendered, the Jetpack post-load event
		 * will be triggered so that any dynamic elements will be re-constructed,
		 * such as ME.js elements, Photon replacements, social sharing, and more.
		 * Note that this is applying here not strictly to posts being loaded.
		 * If a widget contains a ME.js element and it is previewed via selective
		 * refresh, the post-load would get triggered allowing any dynamic elements
		 * therein to also be re-constructed.
		 *
		 * @param {wp.customize.selectiveRefresh.Placement} placement
		 */
		wp.customize.selectiveRefresh.bind( 'partial-content-rendered', function( placement ) {
			var content;
			if ( 'string' === typeof placement.addedContent ) {
				content = placement.addedContent;
			} else if ( placement.container ) {
				content = $( placement.container ).html();
			}

			if ( content ) {
				$( document.body ).trigger( 'post-load', { html: content } );
			}
		} );

		/*
		 * Add partials for posts added via infinite scroll.
		 *
		 * This is unnecessary when MutationObserver is supported by the browser
		 * since then this will be handled by Selective Refresh in core.
		 */
		if ( 'undefined' === typeof MutationObserver ) {
			$( document.body ).on( 'post-load', function( e, response ) {
				var rootElement = null;
				if ( response.html && -1 !== response.html.indexOf( 'data-customize-partial' ) ) {
					if ( infiniteScroll.settings.id ) {
						rootElement = $( '#' + infiniteScroll.settings.id );
					}
					wp.customize.selectiveRefresh.addPartials( rootElement );
				}
			} );
		}
	}
});


})(jQuery); // Close closure
