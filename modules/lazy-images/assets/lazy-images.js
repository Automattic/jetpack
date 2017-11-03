/* global IntersectionObserver */

/**
 * Huge props to deanhume for https://github.com/deanhume/lazy-observer-load
 */
// Get all of the images that are marked up to lazy load
( function() {
	var images = document.querySelectorAll( 'img[data-lazy-src]' ),
		config = {
			// If the image gets within 50px in the Y axis, start the download.
			rootMargin: '50px 0px',
			threshold: 0.01
		},
		imageCount = images.length,
		observer,
		i;

	// If we don't have support for intersection observer, loads the images immediately
	if ( ! ( 'IntersectionObserver' in window ) ) {
		loadImagesImmediately( images );
	} else {
		// It is supported, load the images
		observer = new IntersectionObserver( onIntersection, config );

		// foreach() is not supported in IE
		for ( i = 0; i < images.length; i++ ) {
			var image = images[ i ];
			if ( image.classList.contains( 'jetpack-lazy-image--handled' ) ) {
				continue;
			}

			observer.observe( image );
		}
	}

	/**
	 * Fetchs the image for the given URL
	 * @param {string} url
	 */
	function fetchImage( url, callback ) {
		var image = new Image();
		image.onload = function() {
			callback();
		};

		// An error from loading the image would've loaded
		// a broken image anyways.
		image.onerror = function() {
			callback();
		};

		image.src = url;
	}

	/**
	 * Preloads the image
	 * @param {object} image
	 */
	function preloadImage( image ) {
		var src = image.dataset.lazySrc,
			srcset;

		if ( ! src ) {
			return;
		}

		srcset = image.dataset.lazySrcset;

		fetchImage( src, function() {
			applyImage( image, src, srcset );
		} );
	}

	/**
	 * Load all of the images immediately
	 * @param {NodeListOf<Element>} immediateImages List of lazy-loaded images to load immediately.
	 */
	function loadImagesImmediately( immediateImages ) {
		var i;

		// foreach() is not supported in IE
		for ( i = 0; i < immediateImages.length; i++ ) {
			var image = immediateImages[ i ];
			preloadImage( image );
		}
	}

	/**
	 * On intersection
	 * @param {array} entries List of elements being observed.
	 */
	function onIntersection( entries ) {
		var i;

		// Disconnect if we've already loaded all of the images
		if ( imageCount === 0 ) {
			observer.disconnect();
		}

		// Loop through the entries
		for ( i = 0; i < entries.length; i++ ) {
			var entry = entries[ i ];
			// Are we in viewport?
			if ( entry.intersectionRatio > 0 ) {
				imageCount--;

				// Stop watching and load the image
				observer.unobserve( entry.target );
				preloadImage( entry.target );
			}
		}
	}

	/**
	 * Apply the image
	 * @param {object} img The image object.
	 * @param {string} src The image source to set.
	 * @param {string} srcset The image srcset to set.
	 */
	function applyImage( img, src, srcset ) {
		// Prevent this from being lazy loaded a second time.
		img.classList.add( 'jetpack-lazy-image--handled' );
		img.src = src;
		img.srcset = srcset;
		img.classList.add( 'fade-in' );
	}
} )();
