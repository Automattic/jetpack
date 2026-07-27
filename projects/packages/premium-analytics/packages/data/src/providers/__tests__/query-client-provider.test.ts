/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { apiErrorStatusMiddleware } from '../../api/error-status-middleware';

jest.mock( '@wordpress/api-fetch', () => Object.assign( jest.fn(), { use: jest.fn() } ) );

describe( 'query-client-provider module', () => {
	it( 'installs the error-status middleware when the data package loads', async () => {
		// The app's `init()` module is not involved: WP 7.0's Core `boot` ignores
		// the `initModules` argument to `initSinglePage()`, so anything registered
		// only from `init()` never runs there.
		await import( '../query-client-provider' );

		expect( apiFetch.use ).toHaveBeenCalledWith( apiErrorStatusMiddleware );
	} );
} );
