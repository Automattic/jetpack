import { expect } from '@jest/globals';
import selectors from '../site-rewind';

describe( 'siteRewindPoliciesSelectors', () => {
	const fixtures = {
		emptyObject: {
			siteRewindPolicies: {},
		},
		initialState: {
			siteRewindPolicies: {
				isFetching: false,
				loaded: false,
				activityLogLimitDays: null,
				storageLimitBytes: null,
			},
		},
		fetchingState: {
			siteRewindPolicies: {
				isFetching: true,
				loaded: false,
				activityLogLimitDays: null,
				storageLimitBytes: null,
			},
		},
		failedState: {
			siteRewindPolicies: {
				isFetching: false,
				loaded: false,
				activityLogLimitDays: null,
				storageLimitBytes: null,
			},
		},
		successState: {
			siteRewindPolicies: {
				isFetching: false,
				loaded: true,
				activityLogLimitDays: 30,
				storageLimitBytes: 10737418240,
			},
		},
	};

	describe( 'areRewindPoliciesLoaded()', () => {
		it.each( [
			{
				state: fixtures.emptyObject,
				expected: null,
			},
			{
				state: fixtures.initialState,
				expected: false,
			},
			{
				state: fixtures.fetchingState,
				expected: false,
			},
			{
				state: fixtures.failedState,
				expected: false,
			},
			{
				state: fixtures.successState,
				expected: true,
			},
		] )( 'should return loaded bool value if passed, null otherwise', ( { state, expected } ) => {
			const output = selectors.areRewindPoliciesLoaded( state );
			expect( output ).toBe( expected );
		} );
	} );

	describe( 'hasRewindStorageLimit()', () => {
		it.each( [
			{
				state: fixtures.emptyObject,
				expected: false,
			},
			{
				state: fixtures.initialState,
				expected: false,
			},
			{
				state: fixtures.fetchingState,
				expected: false,
			},
			{
				state: fixtures.failedState,
				expected: false,
			},
			{
				state: fixtures.successState,
				expected: true,
			},
		] )(
			'should return true if storageLimitBytes has a non null value false otherwise',
			( { state, expected } ) => {
				const output = selectors.hasRewindStorageLimit( state );
				expect( output ).toBe( expected );
			}
		);
	} );

	describe( 'isFetchingRewindPolicies()', () => {
		it.each( [
			{
				state: fixtures.emptyObject,
				expected: null,
			},
			{
				state: fixtures.initialState,
				expected: false,
			},
			{
				state: fixtures.fetchingState,
				expected: true,
			},
			{
				state: fixtures.failedState,
				expected: false,
			},
			{
				state: fixtures.successState,
				expected: false,
			},
		] )(
			'should return isFetching bool value if passed, false otherwise',
			( { state, expected } ) => {
				const output = selectors.isFetchingRewindPolicies( state );
				expect( output ).toBe( expected );
			}
		);
	} );

	describe( 'getRewindStorageLimit()', () => {
		it.each( [
			{
				state: fixtures.emptyObject,
				expected: null,
			},
			{
				state: fixtures.initialState,
				expected: null,
			},
			{
				state: fixtures.fetchingState,
				expected: null,
			},
			{
				state: fixtures.failedState,
				expected: null,
			},
			{
				state: fixtures.successState,
				expected: 10737418240,
			},
		] )(
			'should return storageLimitBytes value if passed, null otherwise',
			( { state, expected } ) => {
				const output = selectors.getRewindStorageLimit( state );
				expect( output ).toBe( expected );
			}
		);
	} );
} );
