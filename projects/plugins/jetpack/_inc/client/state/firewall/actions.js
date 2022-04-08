/**
 * Internal dependencies
 */
import {
	WAF_BOOTSTRAP_PATH_FETCH,
	WAF_BOOTSTRAP_PATH_FETCH_RECEIVE,
	WAF_BOOTSTRAP_PATH_FETCH_FAIL,
} from 'state/action-types';
import restApi from '@automattic/jetpack-api';

export const fetchWafBootstrapPath = () => {
	return dispatch => {
		dispatch( {
			type: WAF_BOOTSTRAP_PATH_FETCH,
		} );
		return restApi
			.fetchWafBootstrapPath()
			.then( response => {
				dispatch( {
					type: WAF_BOOTSTRAP_PATH_FETCH_RECEIVE,
					bootstrapPath: response.bootstrapPath,
				} );
				return response.bootstrapPath;
			} )
			.catch( error => {
				dispatch( {
					type: WAF_BOOTSTRAP_PATH_FETCH_FAIL,
					error: error,
				} );
			} );
	};
};
