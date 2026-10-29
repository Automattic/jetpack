// `'auto'` reads the script's own URL, which a plugin that combines scripts points at its cache.
// @see https://webpack.js.org/guides/public-path/#on-the-fly
if ( JetpackComments.assetsUrl ) {
	__webpack_public_path__ = JetpackComments.assetsUrl;
}
