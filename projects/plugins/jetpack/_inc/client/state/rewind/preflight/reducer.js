import {
	BACKUP_PREFLIGHT_TESTS_FETCH,
	BACKUP_PREFLIGHT_TESTS_FETCH_FAILURE,
	BACKUP_PREFLIGHT_TESTS_FETCH_SUCCESS,
} from '../../action-types';
import { PreflightTestStatus } from './constants';
import { calculateOverallStatus } from './utils';

const initialState = {
	error: null,
	featureEnabled: false,
	hasLoaded: false,
	isFetching: false,
	overallStatus: PreflightTestStatus.PENDING,
	tests: [],
};

const preflightReducer = ( state = initialState, action ) => {
	switch ( action.type ) {
		case BACKUP_PREFLIGHT_TESTS_FETCH:
			return {
				...state,
				isFetching: true,
				hasLoaded: false,
			};
		case BACKUP_PREFLIGHT_TESTS_FETCH_FAILURE:
			return {
				...state,
				isFetching: false,
				hasLoaded: true,
				error: action.error,
			};
		case BACKUP_PREFLIGHT_TESTS_FETCH_SUCCESS:
			return {
				...state,
				isFetching: false,
				hasLoaded: true,
				featureEnabled: action.featureEnabled,
				...( action.tests && Array.isArray( action.tests )
					? {
							// tests: action.tests, <- This is not needed for now, but might be useful in the future
							overallStatus: calculateOverallStatus( action.tests ),
					  }
					: {} ),
			};
		default:
			return state;
	}
};

export default preflightReducer;
