import { __, sprintf } from '@wordpress/i18n';
import { ApiError } from './api-error';
import { JETPACK_BOOST_REST_NAMESPACE, JETPACK_BOOST_REST_PREFIX } from './config';
import type { JSONObject } from './utils/json-object-type';

/**
 * Get the full URL to an endpoint.
 *
 * @param {string} path - The path to the endpoint.
 * @param {string} root - The root URL to use.
 * @returns {string} - The full URL.
 */
function getEndpointUrl( path: string, root: string ): string {
	return root + JETPACK_BOOST_REST_NAMESPACE + JETPACK_BOOST_REST_PREFIX + path;
}

/**
 * Send a request to the Boost REST API.
 *
 * @param {string} method - The HTTP method to use.
 * @param {string} root - The root URL to use.
 * @param {string} path - The path to the endpoint.
 * @param {null | JSONObject} body - The body of the request.
 * @param {string} nonce - The nonce to use.
 * @returns {Promise} - The response.
 */
async function sendRequest(
	method: string,
	root: string,
	path: string,
	body: null | JSONObject = null,
	nonce: string
): Promise< Response > {
	const args: JSONObject = {
		method,
		mode: 'cors',
		headers: {
			'X-WP-Nonce': nonce,
		},
	};

	if ( ( 'post' === method || 'delete' === method ) && body ) {
		args.body = JSON.stringify( body );
		args.headers[ 'Content-Type' ] = 'application/json';
	}

	const endpointFullUrl = getEndpointUrl( path, root );
	let apiCall: Response;

	try {
		apiCall = await fetch( endpointFullUrl, args );
	} catch ( error ) {
		const cleanupArgs = args;
		delete cleanupArgs.body;
		delete cleanupArgs.headers[ 'X-WP-Nonce' ];
		const errorInfo = {
			requestInitiator: window.location.href,
			requestUrl: endpointFullUrl,
			requestArgs: cleanupArgs,
			originalErrorMessage: error.toString(),
		};

		// Throwing again an error so it can be caught higher up and displayed in the UI.
		throw new Error(
			sprintf(
				/* Translators: %s refers to a string representation of an error object containing useful debug information  */
				__(
					'An error occurred while trying to communicate with the site REST API. Extra debug info: %s',
					'boost-score-api'
				),
				JSON.stringify( errorInfo )
			)
		);
	}

	return apiCall;
}

/**
 * Make a request to the Boost REST API.
 *
 * @param {string} method - The HTTP method to use.
 * @param {string} root - The root URL to use.
 * @param {string} path - The path to the endpoint.
 * @param {null | JSONObject} body - The body of the request.
 * @param {string} nonce - The nonce to use.
 * @returns {Promise} - The response.
 */
async function makeRequest< T = JSONObject >(
	method: string,
	root: string,
	path: string,
	body: null | JSONObject = null,
	nonce: string
): Promise< T > {
	const response = await sendRequest( method, root, path, body, nonce );

	// Fetch response as text.
	let responseBody: string;
	try {
		responseBody = await response.text();
	} catch ( err ) {
		throw new ApiError( response.status, null, err );
	}

	// Try to parse it as JSON, catch errors explicitly.
	let jsonBody: JSONObject;
	try {
		jsonBody = JSON.parse( responseBody );
	} catch ( err ) {
		throw new ApiError( response.status, responseBody, err );
	}

	// Throw an error if not HTTP 200.
	if ( ! response.ok ) {
		throw new ApiError( response.status, jsonBody, null );
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return jsonBody as any;
}

/**
 * Make a GET request to the Boost REST API.
 *
 * @param {string} root - The root URL to use.
 * @param {string} path - The path to the endpoint.
 * @param {string} nonce - The nonce to use.
 * @returns {Promise} - The response.
 */
function get< T = JSONObject >( root: string, path: string, nonce: string ): Promise< T > {
	return makeRequest< T >( 'get', root, path, null, nonce );
}

/**
 * Make a POST request to the Boost REST API.
 *
 * @param {string} root - The root URL to use.
 * @param {string} path - The path to the endpoint.
 * @param {null | JSONObject} body - The body of the request.
 * @param {string} nonce - The nonce to use.
 * @returns {Promise} - The response.
 */
function post< T = JSONObject >(
	root: string,
	path: string,
	body: JSONObject | null = null,
	nonce: string
): Promise< T > {
	return makeRequest< T >( 'post', root, path, body, nonce );
}

export default {
	get,
	post,
};
