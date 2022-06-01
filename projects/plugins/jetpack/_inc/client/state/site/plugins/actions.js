import restApi from '@automattic/jetpack-api';
import {
	JETPACK_PLUGINS_DATA_FETCH,
	JETPACK_PLUGINS_DATA_FETCH_RECEIVE,
	JETPACK_PLUGINS_DATA_FETCH_FAIL,
} from 'state/action-types';

export const fetchPluginsData = () => {
	return dispatch => {
		dispatch( {
			type: JETPACK_PLUGINS_DATA_FETCH,
		} );
		return restApi
			.fetchPluginsData()
			.then( pluginsData => {
				dispatch( {
					type: JETPACK_PLUGINS_DATA_FETCH_RECEIVE,
					pluginsData: pluginsData,
				} );
				return pluginsData;
			} )
			.catch( error => {
				dispatch( {
					type: JETPACK_PLUGINS_DATA_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};
