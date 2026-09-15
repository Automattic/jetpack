/* exported __webpack_public_path__ */
/* global __webpack_public_path__ */

/**
 * Set webpack's public path at runtime so the lazy Scheduled tasks chunk resolves.
 * `publicPath: 'auto'` breaks under WordPress.com Simple's script concatenation.
 * @see https://webpack.js.org/guides/public-path/#on-the-fly
 */
if ( typeof window === 'object' && window.Jetpack_AI_Admin_Assets_Base_Url ) {
	// eslint-disable-next-line no-global-assign
	__webpack_public_path__ = window.Jetpack_AI_Admin_Assets_Base_Url;
}
