/**
 * Default host for the dev server. Can be overridden via JETPACK_WEBPACK_DEV_SERVER_HOST env var.
 */
const defaultHost = process.env.JETPACK_WEBPACK_DEV_SERVER_HOST || 'localhost';

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

	if ( ! options.port ) {
		// Enforce specifying a port to avoid confusion
		// when multiple configs run dev servers simultaneously.
		throw new Error(
			'DevServer configuration requires a port to be specified. Please ensure the port is not used by any other package/plugin.'
		);
	}

	const port = options.port;
	const host = options.host ?? defaultHost;
	const hot = options.hot ?? true;
	const liveReload = options.liveReload ?? false;
	const writeToDisk = options.writeToDisk ?? true;

	return {
		port,
		host,
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
			// Explicit WebSocket URL so HMR works when WordPress runs on a different host
			webSocketURL: `ws://${ host }:${ port }/ws`,
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
