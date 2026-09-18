/* exported __webpack_public_path__ */
/* global __webpack_public_path__ */

/**
 * Set Webpack's publicPath from the localized global so the guide's artwork
 * resolves against the package build dir. The `'auto'` fallback is unreliable
 * on WordPress.com Simple, where JS concatenation rewrites the script URL that
 * auto-detection reads, leaving every emitted image 404ing.
 *
 * Imported first from bootstrap.tsx so this runs before any image module
 * evaluates its URL.
 * @see https://webpack.js.org/guides/public-path/#on-the-fly
 */
if ( typeof window === 'object' && window.jetpackFormsWelcomeGuide?.assetsUrl ) {
	// @ts-expect-error: __webpack_public_path__ is set globally by webpack, ignore TS2304
	// eslint-disable-next-line no-global-assign
	__webpack_public_path__ = window.jetpackFormsWelcomeGuide.assetsUrl;
}
