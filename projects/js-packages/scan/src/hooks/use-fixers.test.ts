import { jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import API from '../lib/api';
import { wait } from '../tests/utils';
import useFixers from './use-fixers';

jest.mock( '@wordpress/api-fetch' );

jest.mock( '../lib/api', () => {
	const originalModule = jest.requireActual( '../lib/api' );

	return {
		__esModule: true,
		default: {
			...originalModule.default,
			getInstance: jest.fn(),
			fixThreats: jest.fn(),
			getFixStatus: jest.fn(),
		},
	};
} );

describe( 'useFixers', () => {
	let mockAPIInstance;

	beforeEach( () => {
		jest.useFakeTimers();
		jest.spyOn( global, 'setTimeout' );
		jest.spyOn( global, 'clearTimeout' );

		const mockInProgressResponse = {
			threats: { 1: { status: 'in_progress' }, 2: { status: 'in_progress' } },
		};
		const mockFixedResponse = { threats: { 1: { status: 'fixed' }, 2: { status: 'fixed' } } };

		mockAPIInstance = {
			siteId: 123,
			authToken: 'ABC',
			fixThreats: jest.fn( () => Promise.resolve() ),
			getFixStatus: jest.fn( () => {
				mockAPIInstance.__getFixStatusCount++;
				if (
					mockAPIInstance.__getFixStatusCount <= mockAPIInstance.__mockInProgressResponseCount
				) {
					return Promise.resolve( mockInProgressResponse );
				}
				return Promise.resolve( mockFixedResponse );
			} ),
			__getFixStatusCount: 0,
			__mockInProgressResponseCount: 0,
		};

		API.getInstance.mockImplementation( () => mockAPIInstance );
		API.fixThreats.mockImplementation( () => mockAPIInstance.fixThreats() );
		API.getFixStatus.mockImplementation( () => mockAPIInstance.getFixStatus() );
	} );

	afterEach( () => {
		jest.clearAllTimers();
		jest.resetAllMocks();
	} );

	it( 'initializes with the correct state', () => {
		const { result } = renderHook( () => useFixers( { threatIds: [ 1, 2 ] } ) );

		expect( result.current.fixStatuses ).toEqual( { 1: null, 2: null } );
	} );

	it( 'fetches and sets fix states', async () => {
		mockAPIInstance.__mockInProgressResponseCount = 1;

		const { result } = renderHook( () => useFixers( { threatIds: [ 1, 2 ] } ) );

		await act( async () => {
			await result.current.fetchFixStatuses();
		} );

		expect( API.getFixStatus ).toHaveBeenCalledTimes( 1 );
		expect( result.current.fixStatuses ).toEqual( {
			1: 'in_progress',
			2: 'in_progress',
		} );
	} );

	it( 'polls for fix states when requested', async () => {
		mockAPIInstance.__mockInProgressResponseCount = 3;

		const { result } = renderHook( () => useFixers( { threatIds: [ 1, 2 ] } ) );

		await act( async () => {
			result.current.fix( { poll: true } );
		} );

		expect( API.getFixStatus ).toHaveBeenCalledTimes( 1 );
		expect( result.current.fixStatuses ).toEqual( {
			1: 'in_progress',
			2: 'in_progress',
		} );

		await wait( 5 );
		expect( API.getFixStatus ).toHaveBeenCalledTimes( 2 );

		await wait( 10 );

		expect( API.getFixStatus ).toHaveBeenCalledTimes( 4 );
		expect( result.current.fixStatuses ).toEqual( {
			1: 'fixed',
			2: 'fixed',
		} );
	} );
} );
