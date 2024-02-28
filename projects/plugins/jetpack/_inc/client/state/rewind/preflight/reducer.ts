import { AnyAction } from 'redux';
import {
	BACKUP_PREFLIGHT_TESTS_FETCH,
	BACKUP_PREFLIGHT_TESTS_FETCH_FAILURE,
	BACKUP_PREFLIGHT_TESTS_FETCH_SUCCESS,
} from '../../action-types';
import { PreflightState, PreflightTestStatus } from './types';
import { calculateOverallStatus } from './utils';

const initialState: PreflightState = {
	isFetching: false,
	hasLoaded: false,
	overallStatus: PreflightTestStatus.PENDING,
	tests: [],
	error: null,
};

const preflightReducer = ( state = initialState, action: AnyAction ): PreflightState => {
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
				...( action.tests && Array.isArray( action.tests )
					? {
							tests: action.tests,
							overallStatus: calculateOverallStatus( action.tests ),
					  }
					: {} ),
			};
		default:
			return state;
	}
};

export default preflightReducer;
