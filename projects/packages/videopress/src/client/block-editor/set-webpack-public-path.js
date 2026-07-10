/* exported __webpack_public_path__ */
/* global __webpack_public_path__ */

/**
 * Dynamically set Webpack's publicPath so that lazily-loaded chunks (and their
 * CSS) resolve against the package's build directory.
 *
 * We can't rely on `publicPath: 'auto'` because WordPress.com Simple's JS
 * concatenation rewrites script URLs into `/_static/??…`, which breaks the
 * `document.currentScript.src` auto-detection. Self-hosted sites keep working
 * via auto-detection because the global is absent there.
 * @see https://webpack.js.org/guides/public-path/#on-the-fly
 */
if ( typeof window === 'object' && window.videoPressEditorState?.webpackPublicPath ) {
	// eslint-disable-next-line no-global-assign
	__webpack_public_path__ = window.videoPressEditorState.webpackPublicPath;
}
