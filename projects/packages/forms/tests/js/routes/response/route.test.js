/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGetEntityRecords = jest.fn();

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	resolveSelect: () => ( { getEntityRecords: mockGetEntityRecords } ),
} ) );

await jest.unstable_mockModule( '@wordpress/route', () => ( { redirect: jest.fn() } ) );

await jest.unstable_mockModule( '../../../../src/dashboard/wp-build/utils/preload', () => ( {
	preloadGlobalTabCounts: () => Promise.resolve(),
} ) );

const { route: responseRoute } = await import( '../../../../routes/response/route.tsx' );
const { route: responsesRoute } = await import( '../../../../routes/responses/route.tsx' );

describe( 'route loaders', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockGetEntityRecords.mockReturnValue( Promise.resolve( [] ) );
	} );

	// The router awaits a loader that returns a promise, which held navigation on the
	// previous page for a whole round trip. These loaders exist to *start* the fetch,
	// not to gate the transition on it — returning a promise here would silently
	// reintroduce that stall with nothing else failing.
	it.each( [
		[ 'the single response route', () => responseRoute.loader( { params: { responseId: '5' } } ) ],
		[
			'the responses list route',
			() => responsesRoute.loader( { params: { view: 'inbox' }, search: {} } ),
		],
	] )( '%s does not block navigation', ( _label, run ) => {
		const returned = run();

		expect( returned ).toBeUndefined();
	} );

	it( 'still starts the single response fetch', () => {
		responseRoute.loader( { params: { responseId: '5' } } );

		expect( mockGetEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'feedback',
			expect.objectContaining( { include: [ 5 ] } )
		);
	} );

	it( 'skips the fetch for a non-numeric response id', () => {
		responseRoute.loader( { params: { responseId: 'nope' } } );

		expect( mockGetEntityRecords ).not.toHaveBeenCalled();
	} );

	// A preload only helps if it warms the key the list actually reads. This one used
	// to send a bare `status: 'publish'` while the inbox queries `'draft,publish'`.
	it( 'preloads the list using the query the list itself sends', () => {
		responsesRoute.loader( { params: { view: 'inbox' }, search: {} } );

		expect( mockGetEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'feedback',
			expect.objectContaining( { status: 'draft,publish', per_page: 20, page: 1 } )
		);
	} );

	it.each( [
		[ 'spam', 'spam' ],
		[ 'trash', 'trash' ],
		[ 'bogus', 'draft,publish' ],
	] )( 'preloads the %s list with status %s', ( view, expected ) => {
		responsesRoute.loader( { params: { view }, search: {} } );

		expect( mockGetEntityRecords ).toHaveBeenCalledWith(
			'postType',
			'feedback',
			expect.objectContaining( { status: expected } )
		);
	} );
} );
