/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';
/**
 * Internal dependencies
 */
import {
	RESPONSE_STATUS_BY_VIEW,
	getResponseStatusFilter,
	getResponseViewForStatus,
	isResponseView,
} from '../../../src/dashboard/constants.ts';

describe( 'getResponseStatusFilter', () => {
	it.each( [
		[ 'inbox', 'draft,publish' ],
		[ 'spam', 'spam' ],
		[ 'trash', 'trash' ],
	] )( 'maps the %s list to its status filter', ( view, expected ) => {
		expect( getResponseStatusFilter( view ) ).toBe( expected );
	} );

	// The value comes from the URL and goes on to become a REST query arg. A bare
	// `map[ view ]` lookup also finds inherited members, so `?view=constructor`
	// would put the `Object` function into the query.
	it.each( [
		[ 'an unknown list', 'bogus' ],
		[ 'an inherited method', 'constructor' ],
		[ 'the prototype', '__proto__' ],
		[ 'toString', 'toString' ],
		[ 'hasOwnProperty', 'hasOwnProperty' ],
		[ 'nothing at all', undefined ],
		[ 'null', null ],
	] )( 'falls back to the inbox for %s', ( _label, view ) => {
		const filter = getResponseStatusFilter( view );

		expect( typeof filter ).toBe( 'string' );
		expect( filter ).toBe( RESPONSE_STATUS_BY_VIEW.inbox );
	} );
} );

describe( 'isResponseView', () => {
	it( 'accepts only the real lists', () => {
		expect( isResponseView( 'inbox' ) ).toBe( true );
		expect( isResponseView( 'spam' ) ).toBe( true );
		expect( isResponseView( 'trash' ) ).toBe( true );
	} );

	it.each( [ [ 'constructor' ], [ '__proto__' ], [ 'bogus' ], [ undefined ], [ null ] ] )(
		'rejects %s',
		view => {
			expect( isResponseView( view ) ).toBe( false );
		}
	);
} );

describe( 'getResponseViewForStatus', () => {
	it.each( [
		[ 'draft,publish', 'inbox' ],
		[ 'spam', 'spam' ],
		[ 'trash', 'trash' ],
		[ 'something-else', 'inbox' ],
		[ undefined, 'inbox' ],
	] )( 'maps status %s back to the %s list', ( status, expected ) => {
		expect( getResponseViewForStatus( status ) ).toBe( expected );
	} );
} );
