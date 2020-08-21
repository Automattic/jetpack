/* global calypsoifyGutenberg */

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const fetchStatus = async ( type = null ) => {
	const path = addQueryArgs( '/wpcom/v2/memberships/status', {
		...( type && { type } ),
		...( typeof calypsoifyGutenberg !== 'undefined' && { source: 'gutenberg-calypso' } ),
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
