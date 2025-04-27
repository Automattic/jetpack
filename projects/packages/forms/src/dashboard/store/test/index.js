import { createRegistry } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { store } from '..';

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
		expect( registry.select( store ).getSelectedResponsesFromCurrentDataset() ).toEqual(
			expect.arrayContaining( args )
		);
	} );
	it( 'setCurrentQuery', () => {
		const args = { page: 1, search: 'r' };
		registry.dispatch( store ).setCurrentQuery( args );
		expect( registry.select( store ).getCurrentQuery() ).toMatchObject( args );
	} );
} );
