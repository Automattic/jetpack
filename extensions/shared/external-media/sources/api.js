/**
 * External dependencies
 */
import { addQueryArgs } from '@wordpress/url';

const ENDPOINTS = {
	list: '/wpcom/v2/external-media/list/',
	copy: '/wpcom/v2/external-media/copy/',
	connection: '/wpcom/v2/external-media/connection/',
};

export function getApiUrl( command, source, args = {} ) {
	if ( ENDPOINTS[ command ] ) {
		return addQueryArgs( ENDPOINTS[ command ] + source, args );
	}

	return null;
}
