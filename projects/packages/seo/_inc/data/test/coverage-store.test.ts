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
		registry
			.dispatch( coverageStore )
			.applyCoverageDelta( { schema: 0, title: 0, description: 1, search_visible: 0 } );
		expect( registry.select( coverageStore ).getCoverage() ).toEqual( {
			...SEEDED_COVERAGE,
			with_description: 5,
		} );
	} );

	it( 'applies deltas across all four metrics at once', () => {
		const registry = makeRegistry();
		registry
			.dispatch( coverageStore )
			.applyCoverageDelta( { schema: 1, title: -1, description: -1, search_visible: 1 } );
		expect( registry.select( coverageStore ).getCoverage() ).toEqual( {
			total: 10,
			with_schema: 4,
			with_title: 5,
			with_description: 3,
			with_search_visible: 9,
		} );
	} );

	it( 'ignores a zero delta', () => {
		const registry = makeRegistry();
		registry
			.dispatch( coverageStore )
			.applyCoverageDelta( { schema: 0, title: 0, description: 0, search_visible: 0 } );
		expect( registry.select( coverageStore ).getCoverage() ).toEqual( SEEDED_COVERAGE );
	} );
} );
