import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { addQueryArgs } from '@wordpress/url';

const ENDPOINTS = {
	list: '/wpcom/v2/external-media/list/',
	copy: isSimpleSite()
		? '/rest/v1.1/external-media-upload?service='
		: '/wpcom/v2/external-media/copy/',
	connection: '/wpcom/v2/external-media/connection/',
};

export function getApiUrl( command, source, args = {} ) {
	if ( ENDPOINTS[ command ] ) {
		return addQueryArgs( ENDPOINTS[ command ] + source, args );
	}

	return null;
}
