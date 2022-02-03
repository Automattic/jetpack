/**
 * External dependencies
 */
import { parse as parseUrl } from 'url';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

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

		if ( ( ! result && typeof result !== 'object' ) || result.errors ) {
			return Promise.reject( __( 'Could not load data from WordPress.com.', 'jetpack' ) );
		}

		return result;
	} catch ( error ) {
		return Promise.reject( error.message );
	}
};

export default fetchStatus;
