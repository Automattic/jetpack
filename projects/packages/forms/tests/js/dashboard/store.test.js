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
} );
