/**
 * Internal dependencies
 */
import restApi from 'rest-api';
import {
	VAULTPRESS_SITE_DATA_FETCH,
	VAULTPRESS_SITE_DATA_FETCH_FAIL,
	VAULTPRESS_SITE_DATA_FETCH_SUCCESS,
	DASHBOARD_PROTECT_COUNT_FETCH,
	DASHBOARD_PROTECT_COUNT_FETCH_FAIL,
	DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS
} from 'state/action-types';

export const fetchProtectCount = () => {
	return ( dispatch ) => {
		dispatch( {
			type: DASHBOARD_PROTECT_COUNT_FETCH
		} );
		return restApi.getProtectCount().then( protectCount => {
			dispatch( {
				type: DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS,
				protectCount: protectCount
			} );
		} ).catch( error => {
			dispatch( {
				type: DASHBOARD_PROTECT_COUNT_FETCH_FAIL,
				error: error
			} );
		} );
	}
}

export const fetchVaultPressData = () => {
	return ( dispatch ) => {
		dispatch( {
			type: VAULTPRESS_SITE_DATA_FETCH
		} );
		return restApi.getVaultPressData().then( vaultPressData => {
			dispatch( {
				type: VAULTPRESS_SITE_DATA_FETCH_SUCCESS,
				vaultPressData: vaultPressData
			} );
		} ).catch( error => {
			dispatch( {
				type: VAULTPRESS_SITE_DATA_FETCH_FAIL,
				error: error
			} );
		} );
	}
}