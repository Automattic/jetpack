import { createRegistry } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { store } from '../../../src/dashboard/store';

const createRegistryWithStores = () => {
	// Create a registry and register used stores.
	const registry = createRegistry();
	registry.register( store );
	return registry;
};

describe( 'actions', () => {
	let registry;

	beforeEach( () => {
		registry = createRegistryWithStores();
	} );

	it( 'receiveFilters', () => {
		const filters = { date: [ { month: 1, year: 2025 } ], source: [ { id: 29 } ] };
		registry.dispatch( store ).receiveFilters( filters );

		expect( registry.select( store ).getFilters() ).toMatchObject( filters );
	} );

	it( 'setSelectedResponses', () => {
		expect( registry.select( store ).getSelectedResponsesFromCurrentDataset() ).toEqual( [] );

		const args = [ 1, 2, 3 ];
		registry.dispatch( store ).setSelectedResponses( args );

		expect( registry.select( store ).getSelectedResponsesCount() ).toEqual( args.length );

		expect( registry.select( store ).getSelectedResponsesFromCurrentDataset() ).toEqual(
			expect.arrayContaining( args )
		);
	} );

	it( 'setCurrentQuery', () => {
		const args = { page: 1, search: 'r', status: 'spam' };
		registry.dispatch( store ).setCurrentQuery( args );

		expect( registry.select( store ).getCurrentQuery() ).toMatchObject( args );

		expect( registry.select( store ).getCurrentStatus() ).toEqual( args.status );
	} );

	it( 'setCounts stores counts by query key', () => {
		const counts = { inbox: 10, spam: 2, trash: 1 };
		const queryParams = {};
		registry.dispatch( store ).setCounts( counts, queryParams );

		expect( registry.select( store ).getInboxCount( queryParams ) ).toBe( 10 );
		expect( registry.select( store ).getSpamCount( queryParams ) ).toBe( 2 );
		expect( registry.select( store ).getTrashCount( queryParams ) ).toBe( 1 );
	} );

	it( 'setCounts maintains separate caches for different query params', () => {
		// Set counts for unfiltered query
		const unfilteredCounts = { inbox: 10, spam: 2, trash: 1 };
		const unfilteredQuery = {};
		registry.dispatch( store ).setCounts( unfilteredCounts, unfilteredQuery );

		// Set counts for filtered query (unread only)
		const filteredCounts = { inbox: 5, spam: 1, trash: 0 };
		const filteredQuery = { is_unread: true };
		registry.dispatch( store ).setCounts( filteredCounts, filteredQuery );

		// Both sets of counts should be available
		expect( registry.select( store ).getInboxCount( unfilteredQuery ) ).toBe( 10 );
		expect( registry.select( store ).getInboxCount( filteredQuery ) ).toBe( 5 );

		expect( registry.select( store ).getSpamCount( unfilteredQuery ) ).toBe( 2 );
		expect( registry.select( store ).getSpamCount( filteredQuery ) ).toBe( 1 );

		expect( registry.select( store ).getTrashCount( unfilteredQuery ) ).toBe( 1 );
		expect( registry.select( store ).getTrashCount( filteredQuery ) ).toBe( 0 );
	} );

	it( 'setCounts returns default values for uncached query params', () => {
		// Don't set any counts, just query with some params
		const queryParams = { is_unread: true };

		expect( registry.select( store ).getInboxCount( queryParams ) ).toBe( 0 );
		expect( registry.select( store ).getSpamCount( queryParams ) ).toBe( 0 );
		expect( registry.select( store ).getTrashCount( queryParams ) ).toBe( 0 );
	} );

	it( 'setFormStatusCounts stores form status counts', () => {
		const counts = {
			all: 10,
			publish: 5,
			draft: 3,
			pending: 1,
			future: 0,
			private: 1,
			trash: 2,
		};

		expect( registry.select( store ).getFormStatusCounts() ).toBeNull();

		registry.dispatch( store ).setFormStatusCounts( counts );

		expect( registry.select( store ).getFormStatusCounts() ).toEqual( counts );
	} );

	it( 'setFormStatusCounts replaces previous counts', () => {
		const initial = { all: 5, publish: 3, draft: 2, pending: 0, future: 0, private: 0, trash: 1 };
		const updated = { all: 8, publish: 6, draft: 2, pending: 0, future: 0, private: 0, trash: 0 };

		registry.dispatch( store ).setFormStatusCounts( initial );
		registry.dispatch( store ).setFormStatusCounts( updated );

		expect( registry.select( store ).getFormStatusCounts() ).toEqual( updated );
	} );
} );

describe( 'resolvers – shouldInvalidate', () => {
	// Import resolvers directly so we can test shouldInvalidate.
	let resolvers;

	beforeAll( async () => {
		resolvers = await import( '../../../src/dashboard/store/resolvers.js' );
	} );

	it( 'getFormStatusCounts invalidates on INVALIDATE_FORM_STATUS_COUNTS', () => {
		expect(
			resolvers.getFormStatusCounts.shouldInvalidate( {
				type: 'INVALIDATE_FORM_STATUS_COUNTS',
			} )
		).toBe( true );
	} );

	it( 'getFormStatusCounts does not invalidate on unrelated actions', () => {
		expect(
			resolvers.getFormStatusCounts.shouldInvalidate( {
				type: 'SET_FORM_STATUS_COUNTS',
			} )
		).toBe( false );
	} );

	it( 'getCounts invalidates on INVALIDATE_COUNTS', () => {
		expect( resolvers.getCounts.shouldInvalidate( { type: 'INVALIDATE_COUNTS' } ) ).toBe( true );
	} );

	it( 'getCounts does not invalidate on INVALIDATE_FORM_STATUS_COUNTS', () => {
		expect(
			resolvers.getCounts.shouldInvalidate( { type: 'INVALIDATE_FORM_STATUS_COUNTS' } )
		).toBe( false );
	} );
} );
