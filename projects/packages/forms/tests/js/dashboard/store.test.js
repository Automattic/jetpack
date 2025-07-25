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

		// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
		expect( registry.select( store ).getFilters() ).toMatchObject( filters );
	} );

	it( 'setSelectedResponses', () => {
		// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
		expect( registry.select( store ).getSelectedResponsesFromCurrentDataset() ).toEqual( [] );

		const args = [ 1, 2, 3 ];
		registry.dispatch( store ).setSelectedResponses( args );

		// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
		expect( registry.select( store ).getSelectedResponsesCount() ).toEqual( args.length );
		// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
		expect( registry.select( store ).getSelectedResponsesFromCurrentDataset() ).toEqual(
			expect.arrayContaining( args )
		);
	} );

	it( 'setCurrentQuery', () => {
		const args = { page: 1, search: 'r', status: 'spam' };
		registry.dispatch( store ).setCurrentQuery( args );

		// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
		expect( registry.select( store ).getCurrentQuery() ).toMatchObject( args );
		// eslint-disable-next-line testing-library/no-node-access -- https://github.com/testing-library/eslint-plugin-testing-library/issues/1032#issuecomment-3058729104
		expect( registry.select( store ).getCurrentStatus() ).toEqual( args.status );
	} );
} );
