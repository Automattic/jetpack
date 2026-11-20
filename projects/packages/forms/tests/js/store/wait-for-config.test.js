import { describe, expect, it, jest } from '@jest/globals';

const mockApiFetch = jest.fn();
await jest.unstable_mockModule( '@wordpress/api-fetch', () => ( { default: mockApiFetch } ) );

const { resolveSelect } = await import( '@wordpress/data' );
const { store } = await import( '../../../src/store/config/index.ts' );
const { waitForConfig } = await import( '../../../src/store/config/wait-for-config.ts' );

describe( 'waitForConfig', () => {
	it( 'waits for a fetch already in flight instead of resolving with null', async () => {
		let finishFetch;
		mockApiFetch.mockReturnValue( new Promise( resolve => ( finishFetch = resolve ) ) );

		// Another caller starts the fetch, as the dashboard does before a route guard runs.
		resolveSelect( store ).getConfig();
		const waiting = waitForConfig();

		finishFetch( { isCentralFormManagementEnabled: false } );

		await expect( waiting ).resolves.toEqual( { isCentralFormManagementEnabled: false } );
	} );
} );
