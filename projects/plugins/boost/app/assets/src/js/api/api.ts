/* global Jetpack_Boost */
/**
 * Utility class for accessing the API
 */

import { __, sprintf } from '@wordpress/i18n';
import { ApiError } from './api-error';
import type { JSONObject } from '../utils/json-types';

function getEndpointUrl( path: string ): string {
	// eslint-disable-next-line camelcase
	return wpApiSettings.root + Jetpack_Boost.api.namespace + Jetpack_Boost.api.prefix + path;
}

async function sendRequest(
	method: string,
	path: string,
	body: null | JSONObject = null
): Promise< Response > {
	const args: JSONObject = {
		method,
		mode: 'cors',
		headers: {
			'X-WP-Nonce': wpApiSettings.nonce,
		},
	};

	if ( ( 'post' === method || 'delete' === method ) && body ) {
		args.body = JSON.stringify( body );
		args.headers[ 'Content-Type' ] = 'application/json';
	}

	const endpointFullUrl = getEndpointUrl( path );
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
					'jetpack-boost'
				),
				JSON.stringify( errorInfo )
			)
		);
	}

	return apiCall;
}

async function makeRequest< T = JSONObject >(
	method: string,
	path: string,
	body: null | JSONObject = null
): Promise< T > {
	const response = await sendRequest( method, path, body );

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

function get< T = JSONObject >( path: string ): Promise< T > {
	return makeRequest< T >( 'get', path );
}

function post< T = JSONObject >( path: string, body: JSONObject | null = null ): Promise< T > {
	return makeRequest< T >( 'post', path, body );
}

// reserved word, can't use delete directly
function doDelete< T = JSONObject >( path: string, body: JSONObject | null = null ): Promise< T > {
	return makeRequest< T >( 'delete', path, body );
}

export default {
	get,
	post,
	delete: doDelete,
};
