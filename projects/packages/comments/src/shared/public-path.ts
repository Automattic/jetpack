// `'auto'` reads the script's own URL, which a plugin that combines scripts points at its cache.
// @see https://webpack.js.org/guides/public-path/#on-the-fly
if ( JetpackComments.assetsUrl ) {
	// @ts-expect-error: __webpack_public_path__ is set globally by webpack, ignore TS2304
	__webpack_public_path__ = JetpackComments.assetsUrl;
}
