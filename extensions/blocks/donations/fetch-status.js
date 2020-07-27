/**
 * WordPress dependencies
 */
// eslint-disable-next-line wpcalypso/import-docblock
import apiFetch from '@wordpress/api-fetch';

const fetchStatus = async ( type = null ) => {
	let path = '/wpcom/v2/memberships/status';
	if ( type ) {
		path += `?type=${ type }`;
	}
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
