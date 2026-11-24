/* exported __webpack_public_path__ */
/* global __webpack_public_path__ */

/**
 * Point Webpack's public path at the package build dir, so the preview's images load
 * when JS concatenation on WordPress.com Simple serves this script from a `_static` URL.
 * @see https://webpack.js.org/guides/public-path/#on-the-fly
 */
if ( typeof window === 'object' && window.jetpackPayPalPayments?.assetsUrl ) {
	// eslint-disable-next-line no-global-assign
	__webpack_public_path__ = window.jetpackPayPalPayments.assetsUrl;
}
