/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';

// Pin one @wordpress/data instance across resetModules, or each re-import gets
// a fresh registry and the duplicate registration can never happen.
const wpData = await import( '@wordpress/data' );
await jest.unstable_mockModule( '@wordpress/data', () => ( { ...wpData } ) );

const storeModules = [
	[ 'FORM_RESPONSES', () => import( '../../../src/dashboard/store/index.js' ) ],
	[ 'jetpack/forms/config', () => import( '../../../src/store/config/index.ts' ) ],
	[ 'jetpack/forms/integrations', () => import( '../../../src/store/integrations/index.ts' ) ],
];

describe.each( storeModules )( '%s store registration', ( storeName, importModule ) => {
	it( 'registers once when a second bundle evaluates the module', async () => {
		const first = await importModule();

		jest.resetModules();
		const second = await importModule();

		expect( second ).not.toBe( first );
		expect( wpData.select( storeName ) ).toBeTruthy();
		expect( console ).not.toHaveErrored();
	} );
} );
