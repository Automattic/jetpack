import { expect } from '@jest/globals';
import selectors from '../site-rewind';

describe( 'siteRewindSizeSelectors', () => {
	const fixtures = {
		emptyObject: {
			siteRewindSize: {},
		},
		initialState: {
			siteRewindSize: {
				isFetching: false,
				loaded: false,
				size: null,
			},
		},
		fetchingState: {
			siteRewindSize: {
				isFetching: true,
				loaded: false,
				size: null,
			},
		},
		failedState: {
			siteRewindSize: {
				isFetching: false,
				loaded: false,
				size: null,
			},
		},
		successState: {
			siteRewindSize: {
				isFetching: false,
				loaded: true,
				size: 10737418240,
			},
		},
	};

	describe( 'isRewindSizeLoaded()', () => {
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
			const output = selectors.isRewindSizeLoaded( state );
			expect( output ).toBe( expected );
		} );
	} );

	describe( 'isFetchingRewindSize()', () => {
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
				const output = selectors.isFetchingRewindSize( state );
				expect( output ).toBe( expected );
			}
		);
	} );

	describe( 'getRewindSize()', () => {
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
			const output = selectors.getRewindSize( state );
			expect( output ).toBe( expected );
		} );
	} );
} );
