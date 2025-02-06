/* exported __webpack_public_path__ */
/* global __webpack_public_path__ */

/**
 * Dynamically set WebPack's publicPath so that split assets can be found.
 * Unfortunately we can't set `publicPath: 'auto'` because WordPress.com Simple's JS concatenation breaks it (and other plugins that do JS concatenation probably would too).
 * @see https://webpack.js.org/guides/public-path/#on-the-fly
 */
if ( typeof window === 'object' && window.JETPACK_MU_WPCOM_SETTINGS ) {
	// eslint-disable-next-line no-global-assign
	__webpack_public_path__ = window.JETPACK_MU_WPCOM_SETTINGS.assetsUrl;
}
