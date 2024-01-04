import { jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { API, SCAN_STATE_IDLE, SCAN_STATE_SCANNING } from '..';
import { wait } from '../tests/utils';
import useScan from './use-scan';

const mockScanApiResponseBase = {
	state: SCAN_STATE_IDLE,
	threats: [],
	has_cloud: false,
	credentials: [],
};

const mockScanApiResponseScanning = {
	...mockScanApiResponseBase,
	state: SCAN_STATE_SCANNING,
	current: {
		is_initial: true,
		timestamp: '2000-01-01T00:00:00+00:00',
		progress: 50,
	},
};

jest.mock( '@wordpress/api-fetch' );

describe( 'useScan', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		jest.spyOn( global, 'setTimeout' );
		jest.spyOn( global, 'clearTimeout' );
		API.initialize( { siteId: 123, authToken: 'ABC' } );
	} );

	afterEach( () => {
		jest.clearAllTimers();
		jest.resetAllMocks();
		API.destroyInstance();
	} );

	it( 'fetches data from the Scan API', async () => {
		// Mock a response from the Scan API.
		apiFetch.mockResolvedValue( Promise.resolve( mockScanApiResponseBase ) );

		// Initialize the hook and fetch data.
		const { result } = renderHook( () => useScan() );
		await act( async () => {
			result.current.fetch();
		} );

		// Test that data was fetched.
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( result.current.data ).toEqual( mockScanApiResponseBase );
		expect( result.current.error ).toBeUndefined();
	} );

	it( 'polls data from the Scan API', async () => {
		// Mock a "scanning" state from the API.
		apiFetch.mockResolvedValue( Promise.resolve( mockScanApiResponseScanning ) );

		// Initialize the hook and start polling.
		const { result } = renderHook( () => useScan() );
		await act( async () => {
			result.current.poll();
		} );

		// Test that polling has started.
		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( result.current.data ).toEqual( mockScanApiResponseScanning );
		expect( result.current.error ).toBeUndefined();

		// Wait 20 seconds and test that polling has continued.
		await wait( 20 );
		expect( apiFetch ).toHaveBeenCalledTimes( 5 );
		expect( result.current.data ).toEqual( mockScanApiResponseScanning );
		expect( result.current.error ).toBeUndefined();

		// Update the mocked API response to use an "idle" state.
		apiFetch.mockResolvedValue( Promise.resolve( mockScanApiResponseBase ) );

		// Wait 20 seconds and test that polling has stopped.
		await wait( 20 );
		expect( apiFetch ).toHaveBeenCalledTimes( 6 );
		expect( result.current.data ).toEqual( mockScanApiResponseBase );
		expect( result.current.error ).toBeUndefined();
	} );

	/** @todo Test error cases. */
} );
