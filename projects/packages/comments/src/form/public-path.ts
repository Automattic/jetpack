/* exported __webpack_public_path__ */
/* global __webpack_public_path__ */

/**
 * Point webpack at the build directory so the form chunk resolves. `'auto'` is
 * unreliable on WordPress.com Simple, where JS concatenation rewrites the
 * script URL auto-detection reads.
 * @see https://webpack.js.org/guides/public-path/#on-the-fly
 */
if ( typeof window === 'object' && window.JetpackComments?.assetsUrl ) {
	// @ts-expect-error: __webpack_public_path__ is set globally by webpack, ignore TS2304
	// eslint-disable-next-line no-global-assign
	__webpack_public_path__ = window.JetpackComments.assetsUrl;
}
