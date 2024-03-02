import restApi from '@automattic/jetpack-api';
import {
	BACKUP_PREFLIGHT_TESTS_FETCH,
	BACKUP_PREFLIGHT_TESTS_FETCH_SUCCESS,
	BACKUP_PREFLIGHT_TESTS_FETCH_FAILURE,
} from '../../action-types';

export const fetchPreflightStatus = () => {
	return dispatch => {
		dispatch( {
			type: BACKUP_PREFLIGHT_TESTS_FETCH,
		} );
		return restApi
			.fetchBackupPreflightStatus()
			.then( tests => {
				dispatch( {
					type: BACKUP_PREFLIGHT_TESTS_FETCH_SUCCESS,
					featureEnabled: tests.feature_enabled ?? false,
					tests: tests.status,
				} );
			} )
			.catch( error => {
				dispatch( {
					type: BACKUP_PREFLIGHT_TESTS_FETCH_FAILURE,
					error,
				} );
			} );
	};
};
