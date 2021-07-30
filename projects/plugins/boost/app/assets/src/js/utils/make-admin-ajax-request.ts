/**
 * Internal dependencies
 */
import type { JSONObject } from './json-types';

declare const ajaxurl: string;

export async function makeAdminAjaxRequest(
	payload: JSONObject
): Promise< Response > {
	const args = {
		method: 'post',
		body: new URLSearchParams( {
			...payload,
			...{ nonce: Jetpack_Boost.criticalCssAjaxNonce },
		} ),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;',
		},
	};

	return fetch( ajaxurl, args );
}
