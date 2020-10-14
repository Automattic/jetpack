const jetpackLazyImagesModule = function () {
	const config = {
		// If the image gets within 200px in the Y axis, start the download.
		rootMargin: '200px 0px',
		threshold: 0.01,
	};
	let images,
		imageCount = 0,
		observer;

	lazy_load_init();

	const bodyEl = document.querySelector( 'body' );
	if ( bodyEl ) {
		// Lazy load images that are brought in from Infinite Scroll
		bodyEl.addEventListener( 'is.post-load', lazy_load_init );

		// Add event to provide optional compatibility for other code.
		bodyEl.addEventListener( 'jetpack-lazy-images-load', lazy_load_init );
	}

	/**
	 * Initialize the module.
	 */
	function lazy_load_init() {
		images = document.querySelectorAll(
			'img.jetpack-lazy-image:not(.jetpack-lazy-image--handled)'
		);
		imageCount = images.length;

		// If initialized, then disconnect the observer
		if ( observer ) {
			observer.disconnect();
		}

		// If we don't have support for intersection observer, loads the images immediately
		if ( ! ( 'IntersectionObserver' in window ) ) {
			loadImagesImmediately( images );
		} else {
			// It is supported, load the images
			observer = new IntersectionObserver( onIntersection, config );

			// foreach() is not supported in IE
			for ( let i = 0; i < images.length; i++ ) {
				const image = images[ i ];
				if ( image.getAttribute( 'data-lazy-loaded' ) ) {
					continue;
				}

				observer.observe( image );
			}
		}
	}

	/**
	 * Load all of the images immediately
	 *
	 * @param {NodeList} immediateImages - List of lazy-loaded images to load immediately.
	 */
	function loadImagesImmediately( immediateImages ) {
		// foreach() is not supported in IE
		for ( let i = 0; i < immediateImages.length; i++ ) {
			const image = immediateImages[ i ];
			applyImage( image );
		}
	}

	/**
	 * On intersection
	 *
	 * @param {Array} entries - List of elements being observed.
	 */
	function onIntersection( entries ) {
		// Disconnect if we've already loaded all of the images
		if ( imageCount === 0 ) {
			observer.disconnect();
		}

		// Loop through the entries
		for ( let i = 0; i < entries.length; i++ ) {
			const entry = entries[ i ];

			// Are we in viewport?
			if ( entry.intersectionRatio > 0 ) {
				imageCount--;

				// Stop watching and load the image
				observer.unobserve( entry.target );
				applyImage( entry.target );
			}
		}
	}

	/**
	 * Apply the image
	 *
	 * @param {Element} image - The image object.
	 */
	function applyImage( image ) {
		let lazyLoadedImageEvent;

		if ( ! ( image instanceof HTMLImageElement ) ) {
			return;
		}

		const srcset = image.getAttribute( 'data-lazy-srcset' );
		const sizes = image.getAttribute( 'data-lazy-sizes' );

		// Remove lazy attributes.
		image.removeAttribute( 'data-lazy-srcset' );
		image.removeAttribute( 'data-lazy-sizes' );
		image.removeAttribute( 'data-lazy-src' );

		// Add the attributes we want.
		image.classList.add( 'jetpack-lazy-image--handled' );
		image.setAttribute( 'data-lazy-loaded', 1 );

		if ( sizes ) {
			image.setAttribute( 'sizes', sizes );
		}

		if ( ! srcset ) {
			image.removeAttribute( 'srcset' );
		} else {
			image.setAttribute( 'srcset', srcset );
		}

		// Fire an event so that third-party code can perform actions after an image is loaded.
		try {
			lazyLoadedImageEvent = new Event( 'jetpack-lazy-loaded-image', {
				bubbles: true,
				cancelable: true,
			} );
		} catch ( e ) {
			lazyLoadedImageEvent = document.createEvent( 'Event' );
			lazyLoadedImageEvent.initEvent( 'jetpack-lazy-loaded-image', true, true );
		}

		image.dispatchEvent( lazyLoadedImageEvent );
	}
};

// Let's kick things off now
if ( document.readyState === 'interactive' || document.readyState === 'complete' ) {
	jetpackLazyImagesModule();
} else {
	document.addEventListener( 'DOMContentLoaded', jetpackLazyImagesModule );
}
