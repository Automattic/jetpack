/* jshint esversion: 6 */
/* global IntersectionObserver, Promise */

/**
 * Huge props to deanhume for https://github.com/deanhume/lazy-observer-load
 * TODO: IntersectionObserver polyfill: https://github.com/w3c/IntersectionObserver/tree/gh-pages/polyfill
 */
// Get all of the images that are marked up to lazy load
(function($) {
	$(document).ready(function(){
		const images = document.querySelectorAll('img[data-lazy-src]');
		const config = {
			// If the image gets within 50px in the Y axis, start the download.
			rootMargin: '50px 0px',
			threshold: 0.01
		};

		let imageCount = images.length;
		let observer;

		// If we don't have support for intersection observer, loads the images immediately
		if (!('IntersectionObserver' in window)) {
			loadImagesImmediately(images);
		} else {
			// It is supported, load the images
			observer = new IntersectionObserver(onIntersection, config);

			// foreach() is not supported in IE
			for (let i = 0; i < images.length; i++) {
				let image = images[i];
				if (image.classList.contains('jetpack-lazy-image--handled')) {
					continue;
				}

				observer.observe(image);
			}
		}

		/**
		 * Fetchs the image for the given URL
		 * @param {string} url
		 */
		function fetchImage(url) {
			return new Promise( (resolve, reject) => {
				const image = new Image();
				image.src = url;
				image.onload = resolve;
				image.onerror = reject;
			});
		}

		/**
		 * Preloads the image
		 * @param {object} image
		 */
		function preloadImage(image) {
			const src = image.dataset.lazySrc;
			if (!src) {
				return;
			}

			return fetchImage(src).then(() => { applyImage(image, src); });
		}

		/**
		 * Load all of the images immediately
		 * @param {NodeListOf<Element>} images
		 */
		function loadImagesImmediately(images) {
			// foreach() is not supported in IE
			for (let i = 0; i < images.length; i++) {
				let image = images[i];
				preloadImage(image);
			}
		}

		/**
		 * On intersection
		 * @param {array} entries
		 */
		function onIntersection(entries) {
			// Disconnect if we've already loaded all of the images
			if (imageCount === 0) {
				observer.disconnect();
			}

			// Loop through the entries
			for (let i = 0; i < entries.length; i++) {
				let entry = entries[i];
				// Are we in viewport?
				if (entry.intersectionRatio > 0) {
					imageCount--;

					// Stop watching and load the image
					observer.unobserve(entry.target);
					preloadImage(entry.target);
				}
			}
		}

		/**
		 * Apply the image
		 * @param {object} img
		 * @param {string} src
		 */
		function applyImage(img, src) {
			// Prevent this from being lazy loaded a second time.
			img.classList.add('jetpack-lazy-image--handled');
			img.src = src;
			img.classList.add('fade-in');
		}
	});
})(jQuery);