import { expect } from '@jest/globals';
import {
	SITE_REWIND_SIZE_GET,
	SITE_REWIND_SIZE_GET_SUCCESS,
	SITE_REWIND_SIZE_GET_FAILED,
} from '../../actions/types';
import siteRewindSize from '../site-rewind-size';

describe( 'reducer', () => {
	const fixtures = {
		initialState: {
			isFetching: false,
			loaded: false,
			size: null,
		},
		fetchingState: {
			isFetching: true,
			loaded: false,
			size: null,
		},
		failedState: {
			isFetching: false,
			loaded: true,
			size: null,
		},
	};

	describe( 'siteRewindSize()', () => {
		it.each( [
			{
				state: undefined,
				action: {},
				expected: fixtures.initialState,
			},
			{
				state: fixtures.initialState,
				action: { type: SITE_REWIND_SIZE_GET },
				expected: fixtures.fetchingState,
			},
			{
				state: fixtures.initialState,
				action: {
					type: SITE_REWIND_SIZE_GET_SUCCESS,
					payload: {
						size: 10737418240,
					},
				},
				expected: {
					isFetching: false,
					loaded: true,
					size: 10737418240,
				},
			},
			{
				state: fixtures.initialState,
				action: {
					type: SITE_REWIND_SIZE_GET_FAILED,
				},
				expected: fixtures.failedState,
			},
		] )( 'should return expected state', ( { state, action, expected } ) => {
			expect( siteRewindSize( state, action ) ).toEqual( expected );
		} );
	} );
} );
