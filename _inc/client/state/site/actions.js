/**
 * Internal dependencies
 */
import {
	JETPACK_SITE_DATA_FETCH,
	JETPACK_SITE_DATA_FETCH_RECEIVE,
	JETPACK_SITE_DATA_FETCH_FAIL
} from 'state/action-types';
import restApi from 'rest-api';

export const fetchSiteData = () => {
	return ( dispatch ) => {
		dispatch( {
			type: JETPACK_SITE_DATA_FETCH
		} );
		return restApi.fetchSiteData().then( siteData => {
			dispatch( {
				type: JETPACK_SITE_DATA_FETCH_RECEIVE,
				siteData: siteData
			} );
			return siteData;
		} ).catch( error => {
			dispatch( {
				type: JETPACK_SITE_DATA_FETCH_FAIL,
				error: error
			} );
		} );
	}
};
