/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';

// Hand every re-import the same @wordpress/data instance, so the two module
// copies share one registry the way two route bundles share one page.
const wpData = await import( '@wordpress/data' );
await jest.unstable_mockModule( '@wordpress/data', () => ( { ...wpData } ) );

const importStoreModule = () => import( '../../../src/dashboard/store/index.js' );

describe( 'dashboard store registration', () => {
	it( 'registers once when a second bundle evaluates the module', async () => {
		const first = await importStoreModule();

		jest.resetModules();
		const second = await importStoreModule();

		expect( second ).not.toBe( first );
		expect( wpData.select( first.STORE_NAME ) ).toBeTruthy();
	} );
} );
