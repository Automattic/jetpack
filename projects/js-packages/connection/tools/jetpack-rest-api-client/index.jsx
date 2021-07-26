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
		},
		postParams = {
			method: 'post',
			credentials: 'same-origin',
			headers: assign( {}, headers, {
				'Content-type': 'application/json',
			} ),
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
			postParams = {
				method: 'post',
				credentials: 'same-origin',
				headers: assign( {}, headers, {
					'Content-type': 'application/json',
				} ),
			};
		},

		registerSite: ( registrationNonce, redirectUri ) =>
			postRequest( `${ apiRoot }jetpack/v4/connection/register`, postParams, {
				body: JSON.stringify( {
					registration_nonce: registrationNonce,
					no_iframe: true,
					redirect_uri: redirectUri,
				} ),
			} )
				.then( checkStatus )
				.then( parseJsonResponse ),

		fetchAuthorizationUrl: redirectUri =>
			getRequest(
				`${ apiRoot }jetpack/v4/connection/authorize_url?no_iframe=1&redirect_uri=${ encodeURIComponent(
					redirectUri
				) }`,
				getParams
			)
				.then( checkStatus )
				.then( parseJsonResponse ),

		fetchSiteConnectionStatus: () =>
			getRequest( `${ apiRoot }jetpack/v4/connection`, getParams ).then( parseJsonResponse ),

		fetchSiteConnectionData: () =>
			getRequest( `${ apiRoot }jetpack/v4/connection/data`, getParams ).then( parseJsonResponse ),

		disconnectSite: () =>
			postRequest( `${ apiRoot }jetpack/v4/connection`, postParams, {
				body: JSON.stringify( { isActive: false } ),
			} )
				.then( checkStatus )
				.then( parseJsonResponse ),
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

	/**
	 * Perform a GET API request.
	 *
	 * @param {string} route - The API route.
	 * @param {object} params - The request params.
	 * @param {object} [body] - The request body.
	 * @returns {Promise<Response>} The request result promise.
	 */
	function postRequest( route, params, body ) {
		return fetch( route, assign( {}, params, body ) ).catch( catchNetworkErrors );
	}

	assign( this, methods );
}

/**
 * Check the response status.
 *
 * @param {object} response - The API response.
 * @returns {Promise} - The status promise.
 */
function checkStatus( response ) {
	// Regular success responses
	if ( response.status >= 200 && response.status < 300 ) {
		return response;
	}

	if ( response.status === 404 ) {
		return new Promise( () => {
			const err = response.redirected
				? new Api404AfterRedirectError( response.redirected )
				: new Api404Error();
			throw err;
		} );
	}

	return response
		.json()
		.catch( e => catchJsonParseError( e ) )
		.then( json => {
			const error = new Error( `${ json.message } (Status ${ response.status })` );
			error.response = json;
			error.name = 'ApiError';
			throw error;
		} );
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

/**
 * Catches TypeError coming from the Fetch API implementation
 */
function catchNetworkErrors() {
	//Either one of:
	// * A preflight error like a redirection to an external site (which results in a CORS)
	// * A preflight error like ERR_TOO_MANY_REDIRECTS
	throw new FetchNetworkError();
}

const restApi = new JetpackRestApiClient();

export default restApi;
