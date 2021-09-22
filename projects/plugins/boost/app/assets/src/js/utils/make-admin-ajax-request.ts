/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { JSONObject } from './json-types';

declare const ajaxurl: string;

class AdminAjaxError extends Error {
	constructor( message: string ) {
		super( message );
		this.name = 'AdminAjaxError';
	}
}

export async function makeAdminAjaxRequest< T = JSONObject >( payload: JSONObject ): Promise< T > {
	const args = {
		method: 'post',
		body: new URLSearchParams( {
			...payload,
			...{},
		} ),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;',
		},
	};

	const response = await fetch( ajaxurl, args );

	let jsonBody: JSONObject;
	try {
		jsonBody = await response.json();
	} catch ( error ) {
		throw new AdminAjaxError(
			sprintf(
				/* Translators: %s refers to a browser-supplied error message (hopefully already in the right language) */
				__(
					'Received invalid response while communicating with your WordPress site: %s',
					'jetpack-boost'
				),
				error.message
			)
		);
	}
	if ( ! response.ok ) {
		throw new AdminAjaxError(
			sprintf(
				/* Translators: %d refers to numeric HTTP error code */
				__( 'HTTP %d error received while communicating with the server.', 'jetpack-boost' ),
				response.status
			)
		);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return jsonBody as any;
}
