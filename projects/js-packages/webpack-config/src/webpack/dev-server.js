/**
 * Creates a dev server configuration object.
 *
 * Returns undefined when not running `webpack serve` (i.e., when WEBPACK_SERVE !== 'true'),
 * allowing simple usage like `devServer: jetpackWebpackConfig.DevServer()` without manual checks.
 *
 * @param {import('webpack-dev-server').Configuration} options - Configuration options.
 * @return {import('webpack-dev-server').Configuration|undefined} Webpack devServer configuration object, or undefined if not serving.
 */
const DevServer = ( options = {} ) => {
	if ( process.env.WEBPACK_SERVE !== 'true' ) {
		return undefined;
	}

	const hot = options.hot ?? true;
	const liveReload = options.liveReload ?? false;
	const writeToDisk = options.writeToDisk ?? true;

	return {
		host: process.env.JETPACK_WEBPACK_DEV_SERVER_HOST || 'localhost',
		port: process.env.JETPACK_WEBPACK_DEV_SERVER_PORT || 'auto',
		hot,
		liveReload,
		allowedHosts: 'all',
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
			'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
		},
		devMiddleware: {
			// Write files to disk so PHP can read them (asset.php, css, etc.)
			writeToDisk,
		},
		client: {
			webSocketURL: process.env.JETPACK_WEBPACK_DEV_SERVER_CLIENT_URL,
			overlay: {
				errors: true,
				warnings: false,
			},
			logging: 'warn',
		},
		...options,
	};
};

module.exports = DevServer;
