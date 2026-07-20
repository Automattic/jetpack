/* exported __webpack_public_path__ */
/* global __webpack_public_path__ */

/**
 * Set Webpack's publicPath from the localized global so lazy chunks (and their
 * CSS) resolve against the package build dir. The `'auto'` fallback is
 * unreliable on WordPress.com Simple, where JS concatenation rewrites the
 * script URL that auto-detection reads.
 * @see https://webpack.js.org/guides/public-path/#on-the-fly
 */
if ( typeof window === 'object' && window.videoPressEditorState?.webpackPublicPath ) {
	// eslint-disable-next-line no-global-assign
	__webpack_public_path__ = window.videoPressEditorState.webpackPublicPath;
}
