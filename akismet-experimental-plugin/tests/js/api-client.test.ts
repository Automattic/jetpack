jest.mock( '@wordpress/api-fetch', () => {
	const mock = jest.fn();
	return {
		__esModule: true,
		default: mock,
	};
} );

import apiFetch from '@wordpress/api-fetch';
import { apiClient } from '@/lib/api-client';

const fetchMock = apiFetch as unknown as jest.Mock;

describe( 'apiClient', () => {
	beforeEach( () => {
		fetchMock.mockReset();
	} );

	it( 'GETs from the akismet/v1 namespace', async () => {
		fetchMock.mockResolvedValueOnce( { key: 'abc' } );
		const result = await apiClient.get( 'key' );
		expect( fetchMock ).toHaveBeenCalledWith( {
			path: '/akismet/v1/key',
			method: 'GET',
		} );
		expect( result ).toEqual( { key: 'abc' } );
	} );

	it( 'POSTs JSON bodies', async () => {
		fetchMock.mockResolvedValueOnce( {} );
		await apiClient.post( 'settings', { akismet_strictness: '1' } );
		expect( fetchMock ).toHaveBeenCalledWith( {
			path: '/akismet/v1/settings',
			method: 'POST',
			data: { akismet_strictness: '1' },
		} );
	} );

	it( 'PUTs JSON bodies', async () => {
		fetchMock.mockResolvedValueOnce( {} );
		await apiClient.put( 'settings', { foo: 'bar' } );
		expect( fetchMock ).toHaveBeenCalledWith( {
			path: '/akismet/v1/settings',
			method: 'PUT',
			data: { foo: 'bar' },
		} );
	} );

	it( 'DELETEs', async () => {
		fetchMock.mockResolvedValueOnce( { success: true } );
		await apiClient.delete( 'key' );
		expect( fetchMock ).toHaveBeenCalledWith( {
			path: '/akismet/v1/key',
			method: 'DELETE',
		} );
	} );

	it( 'strips a leading slash from endpoint', async () => {
		fetchMock.mockResolvedValueOnce( {} );
		await apiClient.get( '/stats/30-days' );
		expect( fetchMock ).toHaveBeenCalledWith( {
			path: '/akismet/v1/stats/30-days',
			method: 'GET',
		} );
	} );
} );
