import {
	BACKUP_PREFLIGHT_TESTS_FETCH,
	BACKUP_PREFLIGHT_TESTS_FETCH_FAILURE,
	BACKUP_PREFLIGHT_TESTS_FETCH_SUCCESS,
} from '../../../action-types';
import { PreflightTestStatus } from '../constants';
import preflightReducer from '../reducer';
import { calculateOverallStatus } from '../utils';

describe( 'preflightReducer', () => {
	const initialState = {
		error: null,
		featureEnabled: false,
		hasLoaded: false,
		isFetching: false,
		overallStatus: PreflightTestStatus.PENDING,
		tests: [],
	};

	it( 'should return the initial state', () => {
		expect( preflightReducer( undefined, {} ) ).toEqual( initialState );
	} );

	it( 'handles BACKUP_PREFLIGHT_TESTS_FETCH', () => {
		const action = { type: BACKUP_PREFLIGHT_TESTS_FETCH };
		const expectedState = {
			...initialState,
			isFetching: true,
			hasLoaded: false,
		};
		expect( preflightReducer( initialState, action ) ).toEqual( expectedState );
	} );

	it( 'handles BACKUP_PREFLIGHT_TESTS_FETCH_FAILURE', () => {
		const error = new Error( 'Failed to fetch' );
		const action = { type: BACKUP_PREFLIGHT_TESTS_FETCH_FAILURE, error };
		const expectedState = {
			...initialState,
			isFetching: false,
			hasLoaded: true,
			error,
		};
		expect( preflightReducer( initialState, action ) ).toEqual( expectedState );
	} );

	it( 'handles BACKUP_PREFLIGHT_TESTS_FETCH_SUCCESS with tests', () => {
		const tests = [ { id: 1, status: 'success' } ];
		const action = {
			type: BACKUP_PREFLIGHT_TESTS_FETCH_SUCCESS,
			featureEnabled: false,
			tests,
		};
		const expectedState = {
			...initialState,
			isFetching: false,
			hasLoaded: true,
			featureEnabled: false,
			overallStatus: calculateOverallStatus( tests ),
		};
		expect( preflightReducer( initialState, action ) ).toEqual( expectedState );
	} );

	it( 'handles BACKUP_PREFLIGHT_TESTS_FETCH_SUCCESS without tests', () => {
		const action = {
			type: BACKUP_PREFLIGHT_TESTS_FETCH_SUCCESS,
			featureEnabled: true,
		};
		const expectedState = {
			...initialState,
			isFetching: false,
			hasLoaded: true,
			featureEnabled: true,
		};
		expect( preflightReducer( initialState, action ) ).toEqual( expectedState );
	} );
} );
