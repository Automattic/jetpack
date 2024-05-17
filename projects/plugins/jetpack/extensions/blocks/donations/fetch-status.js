import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const fetchStatus = async ( type = null ) => {
	const query = new URLSearchParams( window.location.search );

	const path = addQueryArgs( '/wpcom/v2/memberships/status', {
		source: query.get( 'origin' ) === 'https://wordpress.com' ? 'gutenberg-wpcom' : 'gutenberg',
		...( type && { type } ),
		is_editable: false,
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
