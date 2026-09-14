/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGetConfig = jest.fn();
const mockRedirect = jest.fn( target => ( { __redirect: target } ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	resolveSelect: () => ( { getConfig: mockGetConfig } ),
} ) );

await jest.unstable_mockModule( '@wordpress/route', () => ( { redirect: mockRedirect } ) );

await jest.unstable_mockModule( '../../../../src/dashboard/wp-build/utils/preload', () => ( {
	preloadGlobalTabCounts: () => Promise.resolve(),
} ) );

// Mocked rather than imported: the real module registers a Redux store at import time,
// dragging in the whole data layer for a guard that only needs the store's name.
await jest.unstable_mockModule( '../../../../src/store/config/index.ts', () => ( {
	CONFIG_STORE: 'jetpack/forms/config',
} ) );

const { route: formsRoute } = await import( '../../../../routes/forms/route.tsx' );

/**
 * Runs the route's guard and reports where it sent the user, if anywhere.
 *
 * @return {Promise<string|null>} The redirect target, or null when the route was allowed.
 */
async function guard() {
	try {
		await formsRoute.beforeLoad();
	} catch ( thrown ) {
		return thrown?.__redirect?.href ?? '<threw something else>';
	}
	return null;
}

describe( 'forms route guard', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'allows the route when central form management is enabled', async () => {
		mockGetConfig.mockResolvedValue( { isCentralFormManagementEnabled: true } );

		await expect( guard() ).resolves.toBeNull();
	} );

	it( 'redirects to the inbox when central form management is disabled', async () => {
		mockGetConfig.mockResolvedValue( { isCentralFormManagementEnabled: false } );

		await expect( guard() ).resolves.toBe( '/responses/inbox' );
	} );

	it.each( [ null, undefined ] )(
		'allows the route when no config has resolved yet (%p)',
		async config => {
			mockGetConfig.mockResolvedValue( config );

			await expect( guard() ).resolves.toBeNull();
		}
	);

	it( 'redirects when a loaded config omits the flag', async () => {
		mockGetConfig.mockResolvedValue( {} );

		await expect( guard() ).resolves.toBe( '/responses/inbox' );
	} );
} );
