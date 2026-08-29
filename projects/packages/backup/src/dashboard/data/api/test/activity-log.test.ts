import apiFetch from '@wordpress/api-fetch';
import { fetchActivityLog } from '../activity-log';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
const mockedApiFetch = apiFetch as unknown as jest.Mock;

/**
 * The path the last call was made against.
 *
 * @return The requested path.
 */
function requestedPath(): string {
	return ( mockedApiFetch.mock.calls[ 0 ]?.[ 0 ] as { path?: string } )?.path ?? '';
}

beforeEach( () => {
	mockedApiFetch.mockReset();
	mockedApiFetch.mockResolvedValue( { current: { orderedItems: [] } } );
} );

describe( 'fetchActivityLog', () => {
	it( 'sends the sort direction as a query param', async () => {
		await fetchActivityLog( { page: 2, number: 20, sort_order: 'asc' } );

		const path = requestedPath();
		expect( path ).toContain( 'sort_order=asc' );
		expect( path ).toContain( 'page=2' );
		expect( path ).toContain( 'number=20' );
	} );

	it( 'omits the direction when none is asked for', async () => {
		// The bridge and WordPress.com both default to `desc`. Sending an
		// empty `sort_order` would fail the route's `enum` validation with a
		// 400 rather than falling through to that default.
		await fetchActivityLog( { page: 1, number: 10 } );

		expect( requestedPath() ).not.toContain( 'sort_order' );
	} );
} );
