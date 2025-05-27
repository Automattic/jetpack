/* exported __webpack_public_path__ */
/* global __webpack_public_path__ */

/**
 * Dynamically set WebPack's publicPath so that split assets can be found.
 * This ensures that assets (like images) are loaded from the correct path
 * regardless of the environment (WordPress.com, Simple sites, etc.).
 */
if ( typeof window === 'object' && window.JetpackScriptData?.social?.urls?.webpackPublicPath ) {
	// eslint-disable-next-line no-global-assign
	__webpack_public_path__ = window.JetpackScriptData.social.urls.webpackPublicPath;
}
