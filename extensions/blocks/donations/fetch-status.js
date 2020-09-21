/**
 * External dependencies
 */
import { parse as parseUrl } from 'url';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const fetchStatus = async ( type = null ) => {
	const { query } = parseUrl( window.location.href, true );

	const path = addQueryArgs( '/wpcom/v2/memberships/status', {
		source: query.origin === 'https://wordpress.com' ? 'gutenberg-wpcom' : 'gutenberg',
		...( type && { type } ),
	} );
	try {
		const result = await apiFetch( {
			path,
			method: 'GET',
		} );
		return result;
	} catch ( error ) {
		return Promise.reject( error.message );
	}
};

export default fetchStatus;
