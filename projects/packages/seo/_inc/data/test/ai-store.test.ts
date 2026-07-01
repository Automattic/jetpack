import { createRegistry } from '@wordpress/data';
import { SEEDED_AI } from './fixtures/store-fixtures';
// eslint-disable-next-line import/order -- the fixture must seed the bootstrap global before the store reads DEFAULT_STATE.
import { aiStore } from '../ai-store';

const makeRegistry = () => {
	const registry = createRegistry();
	registry.register( aiStore );
	return registry;
};

describe( 'ai-store', () => {
	it( 'seeds the enhancer state from the page bootstrap', () => {
		const registry = makeRegistry();
		expect( registry.select( aiStore ).getEnhancer() ).toEqual( SEEDED_AI.enhancer );
	} );

	it( 'replaces the enhancer state on setEnhancer', () => {
		const registry = makeRegistry();
		const next = { available: true, enabled: true };
		registry.dispatch( aiStore ).setEnhancer( next );
		expect( registry.select( aiStore ).getEnhancer() ).toEqual( next );
	} );
} );
