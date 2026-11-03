/*
 * @jest-environment-options {"url": "https://example.com/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin"}
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { LAST_TAB_COOKIE, getLastTab, saveLastTab } from '../../../src/dashboard/last-tab-cookie';

afterEach( () => {
	document.cookie = `${ LAST_TAB_COOKIE }=; path=/wp-admin/; max-age=0`;
	document.cookie = `x${ LAST_TAB_COOKIE }=; path=/wp-admin/; max-age=0`;
	jest.restoreAllMocks();
} );

describe( 'saveLastTab', () => {
	it.each( [ 'forms', 'responses' ] )( 'stores the chosen tab (%s)', tab => {
		saveLastTab( tab );

		expect( document.cookie ).toContain( `${ LAST_TAB_COOKIE }=${ tab }` );
	} );

	// Neither attribute is visible to a document.cookie read.
	it( 'scopes the cookie to the admin directory and marks it Secure', () => {
		const setCookie = jest.spyOn( Document.prototype, 'cookie', 'set' );

		saveLastTab( 'forms' );

		expect( setCookie ).toHaveBeenCalledWith( expect.stringContaining( 'path=/wp-admin/' ) );
		expect( setCookie ).toHaveBeenCalledWith( expect.stringContaining( '; Secure' ) );
	} );
} );

describe( 'getLastTab', () => {
	it.each( [
		[ 'a saved tab', () => saveLastTab( 'responses' ), 'responses' ],
		[ 'no cookie', () => {}, null ],
		[
			'an unrecognised value',
			() => ( document.cookie = `${ LAST_TAB_COOKIE }=nope; path=/wp-admin/` ),
			null,
		],
		[
			'a cookie whose name only ends the same',
			() => ( document.cookie = `x${ LAST_TAB_COOKIE }=forms; path=/wp-admin/` ),
			null,
		],
	] )( 'reads %s', ( _label, setup, expected ) => {
		setup();

		expect( getLastTab() ).toBe( expected );
	} );
} );
