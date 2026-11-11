import apiFetch from '@wordpress/api-fetch';
import { fetchBulkRemoveStatus, startBulkRemove } from '../_inc/subscribers/data/api';

jest.mock( '@wordpress/api-fetch' );

const mockApiFetch = apiFetch as unknown as jest.Mock;

describe( 'bulk remove API', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockApiFetch.mockResolvedValue( { job: null } );
	} );

	it( 'POSTs the filters, search and typed count to the proxy route', async () => {
		await startBulkRemove( { filters: [ 'free' ], search: 'gmail', expectedCount: 1200 } );

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/subscribers/bulk-remove',
			method: 'POST',
			data: { filters: [ 'free' ], search: 'gmail', expected_count: 1200 },
		} );
	} );

	it( 'sends `all` when no filter is set', async () => {
		await startBulkRemove( { filters: [], search: '', expectedCount: 5 } );

		expect( mockApiFetch.mock.calls[ 0 ][ 0 ].data.filters ).toEqual( [ 'all' ] );
	} );

	it( 'reads the current removal without a job id', async () => {
		await fetchBulkRemoveStatus();

		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wpcom/v2/subscribers/bulk-remove/status',
			method: 'GET',
		} );
	} );

	it( 'reads one removal by job id', async () => {
		await fetchBulkRemoveStatus( 42 );

		expect( mockApiFetch.mock.calls[ 0 ][ 0 ].path ).toBe(
			'/wpcom/v2/subscribers/bulk-remove/status?job_id=42'
		);
	} );
} );
