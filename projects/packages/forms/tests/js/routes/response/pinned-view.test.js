/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';
/**
 * Internal dependencies
 */
import {
	DEFAULT_PINNED_VIEW,
	buildResponseLink,
	buildResponseSearch,
	getPinnedView,
	getViewStatus,
	isDefaultPinnedView,
} from '../../../../routes/response/pinned-view.ts';
import { RESPONSES_PER_PAGE } from '../../../../src/dashboard/constants.ts';

describe( 'getPinnedView', () => {
	it( 'falls back to the inbox when no view is pinned', () => {
		expect( getPinnedView( {} ) ).toEqual( DEFAULT_PINNED_VIEW );
		expect( getPinnedView( undefined ) ).toEqual( DEFAULT_PINNED_VIEW );
	} );

	it( 'returns the pinned query as-is', () => {
		const pinned = {
			status: 'spam',
			search: 'urgent',
			orderby: 'title',
			order: 'asc',
			parent: '42',
		};

		expect( getPinnedView( { view: pinned } ) ).toEqual( pinned );
	} );

	// The value arrives from a user-editable URL and goes on to become REST query
	// args, so anything that isn't a plain object has to be discarded rather than
	// forwarded.
	it.each( [
		[ 'a string', 'inbox' ],
		[ 'an array', [ 'spam' ] ],
		[ 'a number', 7 ],
		[ 'null', null ],
	] )( 'ignores %s', ( _label, value ) => {
		expect( getPinnedView( { view: value } ) ).toEqual( DEFAULT_PINNED_VIEW );
	} );

	// Without a status the collection endpoint defaults to `publish` only, which
	// would silently drop drafts out of the sequence.
	it( 'supplies the default status when the pinned query omits it', () => {
		expect( getPinnedView( { view: { search: 'hello' } } ) ).toEqual( {
			search: 'hello',
			status: DEFAULT_PINNED_VIEW.status,
		} );
	} );
} );

describe( 'getViewStatus', () => {
	it.each( [
		[ 'draft,publish', 'inbox' ],
		[ 'spam', 'spam' ],
		[ 'trash', 'trash' ],
		[ 'something-else', 'inbox' ],
	] )( 'maps status %s to the %s list', ( status, expected ) => {
		expect( getViewStatus( { status } ) ).toBe( expected );
	} );
} );

describe( 'isDefaultPinnedView', () => {
	it( 'recognises the default', () => {
		expect( isDefaultPinnedView( DEFAULT_PINNED_VIEW ) ).toBe( true );
	} );

	it.each( [
		[ 'a different status', { status: 'spam' } ],
		[ 'a search term', { search: 'hello' } ],
		[ 'a different order', { order: 'asc' } ],
		[ 'a form filter', { parent: '42' } ],
		[ 'a different page size', { per_page: 50 } ],
	] )( 'rejects %s', ( _label, overrides ) => {
		expect( isDefaultPinnedView( { ...DEFAULT_PINNED_VIEW, ...overrides } ) ).toBe( false );
	} );

	// core-data slices a query's results to `per_page`, defaulting to 10. Treating a
	// query that omits it as "the default" would leave the reader navigating a
	// 10-long sequence while the list they came from showed 20.
	it( 'rejects a query missing per_page', () => {
		const { per_page: _omitted, ...withoutPerPage } = DEFAULT_PINNED_VIEW;

		expect( isDefaultPinnedView( withoutPerPage ) ).toBe( false );
	} );

	it( 'carries a page size the navigable sequence depends on', () => {
		expect( DEFAULT_PINNED_VIEW.per_page ).toBe( RESPONSES_PER_PAGE );
	} );
} );

describe( 'buildResponseSearch', () => {
	it( 'leaves the default view off the URL', () => {
		expect( buildResponseSearch( DEFAULT_PINNED_VIEW ) ).toEqual( {} );
		expect( buildResponseSearch( null ) ).toEqual( {} );
	} );

	it( 'pins a non-default view', () => {
		const pinned = { ...DEFAULT_PINNED_VIEW, status: 'spam' };

		expect( buildResponseSearch( pinned ) ).toEqual( { view: pinned } );
	} );

	it( 'keeps other search params alongside the pinned view', () => {
		const pinned = { ...DEFAULT_PINNED_VIEW, status: 'trash' };

		expect( buildResponseSearch( pinned, { print: 1 } ) ).toEqual( { view: pinned, print: 1 } );
	} );

	it( 'keeps other search params when the view is the default', () => {
		expect( buildResponseSearch( DEFAULT_PINNED_VIEW, { print: 1 } ) ).toEqual( { print: 1 } );
	} );
} );

describe( 'buildResponseLink', () => {
	// The responses list's View action navigates with a bare `{ to }`; adding an
	// empty `search` would be indistinguishable noise, and there is a regression
	// guard in `view-action.test.js` asserting the key is absent.
	it( 'omits search entirely when there is nothing to pin', () => {
		expect( buildResponseLink( 7, DEFAULT_PINNED_VIEW ) ).toEqual( { to: '/response/7' } );
		expect( buildResponseLink( 7 ) ).toEqual( { to: '/response/7' } );
	} );

	it( 'pins a non-default view', () => {
		const pinned = { ...DEFAULT_PINNED_VIEW, status: 'spam' };

		expect( buildResponseLink( 7, pinned ) ).toEqual( {
			to: '/response/7',
			search: { view: pinned },
		} );
	} );

	it( 'carries extra params even when the view is the default', () => {
		expect( buildResponseLink( 7, DEFAULT_PINNED_VIEW, { print: 1 } ) ).toEqual( {
			to: '/response/7',
			search: { print: 1 },
		} );
	} );
} );
