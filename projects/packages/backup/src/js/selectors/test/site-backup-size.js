import { expect } from '@jest/globals';
import selectors from '../site-backup';

describe( 'siteBackupSizeSelectors', () => {
	const fixtures = {
		emptyObject: {
			siteBackupSize: {},
		},
		initialState: {
			siteBackupSize: {
				isFetching: false,
				loaded: false,
				size: null,
			},
		},
		fetchingState: {
			siteBackupSize: {
				isFetching: true,
				loaded: false,
				size: null,
			},
		},
		failedState: {
			siteBackupSize: {
				isFetching: false,
				loaded: false,
				size: null,
			},
		},
		successState: {
			siteBackupSize: {
				isFetching: false,
				loaded: true,
				size: 10737418240,
			},
		},
	};

	describe( 'isFetchingBackupSize()', () => {
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
			'should return isFetching bool value if passed, null otherwise',
			( { state, expected } ) => {
				const output = selectors.isFetchingBackupSize( state );
				expect( output ).toBe( expected );
			}
		);
	} );

	describe( 'getBackupSize()', () => {
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
		] )( 'should return size value if passed, null otherwise', ( { state, expected } ) => {
			const output = selectors.getBackupSize( state );
			expect( output ).toBe( expected );
		} );
	} );
} );
