const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util' );

/**
 * Used to determine if the module import request should be externalized.
 *
 * Here we want to externalize `@automattic/jetpack-publicize`
 *
 * @param {string} request - Requested module
 * @returns {(string|string[]|undefined)} Script global
 */
function requestToExternal( request ) {
	if ( request === '@automattic/jetpack-publicize' ) {
		return 'JetpackPublicize';
	}

	return defaultRequestToExternal( request );
}

/**
 * Transform @automattic dependencies:
 * - request `@automattic/jetpack-publicize` becomes `jetpack-publicize`
 *
 * @param {string} request - Module request (the module name in `import from`) to be transformed
 * @returns {string|undefined} Script handle to map the request to.
 */
function requestToHandle( request ) {
	if ( '@automattic/jetpack-publicize' === request ) {
		return 'jetpack-publicize';
	}

	return defaultRequestToHandle( request );
}

module.exports = {
	requestToExternal,
	requestToHandle,
};
