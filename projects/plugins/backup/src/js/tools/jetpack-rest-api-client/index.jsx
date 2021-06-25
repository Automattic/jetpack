/**
 * External dependencies
 */
import { assign } from 'lodash';

/**
 * Helps create new custom error classes to better notify upper layers.
 *
 * @param {string} name - The Error name that will be available in `Error.name`.
 * @returns {Error}      a new custom error class.
 */
function createCustomError( name ) {
	class CustomError extends Error {
		constructor( ...args ) {
			super( ...args );
			this.name = name;
		}
	}
	return CustomError;
}

export const JsonParseError = createCustomError( 'JsonParseError' );
export const JsonParseAfterRedirectError = createCustomError( 'JsonParseAfterRedirectError' );
export const Api404Error = createCustomError( 'Api404Error' );
export const Api404AfterRedirectError = createCustomError( 'Api404AfterRedirectError' );
export const FetchNetworkError = createCustomError( 'FetchNetworkError' );

/**
 * Jetpack REST API Client.
 *
 * @param {string} root - The API root URL.
 * @param {string} nonce - The API nonce.
 * @class
 */
function JetpackRestApiClient( root, nonce ) {
	let apiRoot = root,
		headers = {
			'X-WP-Nonce': nonce,
		},
		getParams = {
			credentials: 'same-origin',
			headers,
		};

	const methods = {
		setApiRoot( newRoot ) {
			apiRoot = newRoot;
		},
		setApiNonce( newNonce ) {
			headers = {
				'X-WP-Nonce': newNonce,
			};
			getParams = {
				credentials: 'same-origin',
				headers: headers,
			};
		},

		fetchRecentBackups: () =>
			getRequest( `${ apiRoot }jetpack/v4/backups`, getParams ).then( parseJsonResponse ),
	};

	/**
	 * Add the cache buster value to the URL.
	 *
	 * @param {string} route - The API route URL.
	 * @returns {string} The API route URL with cache buster added.
	 */
	function addCacheBuster( route ) {
		const parts = route.split( '?' ),
			query = parts.length > 1 ? parts[ 1 ] : '',
			args = query.length ? query.split( '&' ) : [];

		args.push( '_cacheBuster=' + new Date().getTime() );

		return parts[ 0 ] + '?' + args.join( '&' );
	}

	/**
	 * Perform a GET API request.
	 *
	 * @param {string} route - The API route.
	 * @param {object} params - The request params.
	 * @returns {Promise<Response>} The request result promise.
	 */
	function getRequest( route, params ) {
		return fetch( addCacheBuster( route ), params );
	}

	assign( this, methods );
}

/**
 * Parse JSON response.
 *
 * @param {string} response - The JSON string.
 * @returns {object} The parsed JSON object.
 */
function parseJsonResponse( response ) {
	return response.json().catch( e => catchJsonParseError( e, response.redirected, response.url ) );
}

/**
 * Catch a JSON parse error.
 *
 * @param {object} e - The error.
 * @param {boolean} redirected - Whether it is an "after redirect" parse error.
 * @param {string} url - The redirect URL.
 */
function catchJsonParseError( e, redirected, url ) {
	const err = redirected ? new JsonParseAfterRedirectError( url ) : new JsonParseError();
	throw err;
}

const restApi = new JetpackRestApiClient();

export default restApi;
