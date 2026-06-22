import { createRegistry } from '@wordpress/data';
import { SEEDED_COVERAGE } from './fixtures/store-fixtures';
// eslint-disable-next-line import/order -- the fixture must seed the bootstrap global before the store reads DEFAULT_STATE.
import { coverageStore } from '../coverage-store';

const makeRegistry = () => {
	const registry = createRegistry();
	registry.register( coverageStore );
	return registry;
};

describe( 'coverage-store', () => {
	it( 'seeds coverage from the page bootstrap', () => {
		const registry = makeRegistry();
		expect( registry.select( coverageStore ).getCoverage() ).toEqual( SEEDED_COVERAGE );
	} );

	it( 'applies a positive description delta to the counts', () => {
		const registry = makeRegistry();
		registry.dispatch( coverageStore ).applyCoverageDelta( { description: 1, schema: 0 } );
		expect( registry.select( coverageStore ).getCoverage() ).toEqual( {
			total: 10,
			with_description: 5,
			with_schema: 3,
		} );
	} );

	it( 'applies a negative description and positive schema delta', () => {
		const registry = makeRegistry();
		registry.dispatch( coverageStore ).applyCoverageDelta( { description: -1, schema: 1 } );
		expect( registry.select( coverageStore ).getCoverage() ).toEqual( {
			total: 10,
			with_description: 3,
			with_schema: 4,
		} );
	} );

	it( 'ignores unrelated actions', () => {
		const registry = makeRegistry();
		registry.dispatch( coverageStore ).applyCoverageDelta( { description: 0, schema: 0 } );
		expect( registry.select( coverageStore ).getCoverage() ).toEqual( SEEDED_COVERAGE );
	} );
} );
