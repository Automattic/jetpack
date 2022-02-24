/**
 * Internal dependencies
 */
import api from '../api/api';

export function requestCloudCss(): Promise< string > {
	return api.post( '/cloud-css/request-generate' );
}

export function getCloudCssStatus(): Promise< string > {
	return api.get( '/cloud-css/status' );
}
