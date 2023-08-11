import restApi from '@automattic/jetpack-api';
import {
	STATS_SWITCH_TAB,
	STATS_DATA_FETCH,
	STATS_DATA_FETCH_FAIL,
	STATS_DATA_FETCH_SUCCESS,
	AKISMET_DATA_FETCH,
	AKISMET_DATA_FETCH_FAIL,
	AKISMET_DATA_FETCH_SUCCESS,
	AKISMET_KEY_CHECK_FETCH,
	AKISMET_KEY_CHECK_FETCH_FAIL,
	AKISMET_KEY_CHECK_FETCH_SUCCESS,
	VAULTPRESS_SITE_DATA_FETCH,
	VAULTPRESS_SITE_DATA_FETCH_FAIL,
	VAULTPRESS_SITE_DATA_FETCH_SUCCESS,
	DASHBOARD_PROTECT_COUNT_FETCH,
	DASHBOARD_PROTECT_COUNT_FETCH_FAIL,
	DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS,
	PLUGIN_UPDATES_FETCH,
	PLUGIN_UPDATES_FETCH_FAIL,
	PLUGIN_UPDATES_FETCH_SUCCESS,
} from 'state/action-types';

export const statsSwitchTab = tab => {
	return dispatch => {
		dispatch( {
			type: STATS_SWITCH_TAB,
			activeStatsTab: tab,
		} );
	};
};

export const fetchStatsData = range => {
	return dispatch => {
		dispatch( {
			type: STATS_DATA_FETCH,
		} );
		return restApi
			.fetchStatsData( range )
			.then( statsData => {
				dispatch( {
					type: STATS_DATA_FETCH_SUCCESS,
					statsData: statsData,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: STATS_DATA_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const fetchProtectCount = () => {
	return dispatch => {
		dispatch( {
			type: DASHBOARD_PROTECT_COUNT_FETCH,
		} );
		return restApi
			.getProtectCount()
			.then( protectCount => {
				dispatch( {
					type: DASHBOARD_PROTECT_COUNT_FETCH_SUCCESS,
					protectCount: protectCount,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: DASHBOARD_PROTECT_COUNT_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const fetchVaultPressData = () => {
	return dispatch => {
		dispatch( {
			type: VAULTPRESS_SITE_DATA_FETCH,
		} );
		return restApi
			.getVaultPressData()
			.then( vaultPressData => {
				dispatch( {
					type: VAULTPRESS_SITE_DATA_FETCH_SUCCESS,
					vaultPressData: vaultPressData,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: VAULTPRESS_SITE_DATA_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const fetchAkismetData = () => {
	return dispatch => {
		dispatch( {
			type: AKISMET_DATA_FETCH,
		} );
		return restApi
			.getAkismetData()
			.then( akismetData => {
				dispatch( {
					type: AKISMET_DATA_FETCH_SUCCESS,
					akismetData: akismetData,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: AKISMET_DATA_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};

export const checkAkismetKey = ( apiKey = '' ) => {
	return dispatch => {
		dispatch( {
			type: AKISMET_KEY_CHECK_FETCH,
		} );
		const response =
			'' === apiKey
				? restApi.checkAkismetKey().then( isAkismetKeyValid => {
						dispatch( {
							type: AKISMET_KEY_CHECK_FETCH_SUCCESS,
							akismet: isAkismetKeyValid,
						} );
				  } )
				: restApi.checkAkismetKeyTyped( apiKey ).then( isAkismetKeyValid => {
						dispatch( {
							type: AKISMET_KEY_CHECK_FETCH_SUCCESS,
							akismet: isAkismetKeyValid,
						} );
				  } );
		return response.catch( error => {
			dispatch( {
				type: AKISMET_KEY_CHECK_FETCH_FAIL,
				error: error,
			} );
		} );
	};
};

export const fetchPluginUpdates = () => {
	return dispatch => {
		dispatch( {
			type: PLUGIN_UPDATES_FETCH,
		} );
		return restApi
			.getPluginUpdates()
			.then( pluginUpdates => {
				dispatch( {
					type: PLUGIN_UPDATES_FETCH_SUCCESS,
					pluginUpdates: pluginUpdates,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: PLUGIN_UPDATES_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};
