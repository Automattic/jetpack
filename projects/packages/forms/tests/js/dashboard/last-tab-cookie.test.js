/*
 * @jest-environment-options {"url": "https://example.com/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin"}
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { LAST_TAB_COOKIE, saveLastTab } from '../../../src/dashboard/last-tab-cookie';

describe( 'saveLastTab', () => {
	afterEach( () => {
		document.cookie = `${ LAST_TAB_COOKIE }=; path=/wp-admin/; max-age=0`;
		jest.restoreAllMocks();
	} );

	it.each( [ 'forms', 'responses' ] )( 'stores the chosen tab (%s)', tab => {
		saveLastTab( tab );

		expect( document.cookie ).toContain( `${ LAST_TAB_COOKIE }=${ tab }` );
	} );

	// Neither attribute is visible to a document.cookie read, and the path is load-bearing:
	// the redirect that reads this only receives the cookie if it is scoped here.
	it( 'scopes the cookie to the admin directory and marks it Secure', () => {
		const setCookie = jest.spyOn( Document.prototype, 'cookie', 'set' );

		saveLastTab( 'forms' );

		expect( setCookie ).toHaveBeenCalledWith( expect.stringContaining( 'path=/wp-admin/' ) );
		expect( setCookie ).toHaveBeenCalledWith( expect.stringContaining( '; Secure' ) );
	} );
} );
