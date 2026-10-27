import { createRegistry } from '@wordpress/data';
import { SEEDED_GEO } from './fixtures/store-fixtures';
// eslint-disable-next-line import/order -- the fixture must seed the bootstrap global before the store reads DEFAULT_STATE.
import { geoStore } from '../geo-store';

const makeRegistry = () => {
	const registry = createRegistry();
	registry.register( geoStore );
	return registry;
};

describe( 'geo-store', () => {
	it( 'seeds the enhancer state from the page bootstrap', () => {
		const registry = makeRegistry();
		expect( registry.select( geoStore ).getEnhancer() ).toEqual( SEEDED_GEO.enhancer );
	} );

	it( 'replaces the enhancer state on setEnhancer', () => {
		const registry = makeRegistry();
		const next = { available: true, enabled: true, aiSeoEnabled: false, aiEnabled: true };
		registry.dispatch( geoStore ).setEnhancer( next );
		expect( registry.select( geoStore ).getEnhancer() ).toEqual( next );
	} );

	it( 'seeds the llms.txt state from the page bootstrap', () => {
		const registry = makeRegistry();
		expect( registry.select( geoStore ).getLlmsTxt() ).toEqual( SEEDED_GEO.llmsTxt );
	} );

	it( 'replaces the llms.txt state on setLlmsTxt without touching other slices', () => {
		const registry = makeRegistry();
		const next = { enabled: true, url: SEEDED_GEO.llmsTxt.url, canServe: true };
		registry.dispatch( geoStore ).setLlmsTxt( next );
		expect( registry.select( geoStore ).getLlmsTxt() ).toEqual( next );
		expect( registry.select( geoStore ).getEnhancer() ).toEqual( SEEDED_GEO.enhancer );
	} );

	it( 'seeds the crawler state from the page bootstrap', () => {
		const registry = makeRegistry();
		expect( registry.select( geoStore ).getCrawlers() ).toEqual( SEEDED_GEO.crawlers );
	} );

	it( 'replaces the crawler state on setCrawlers without touching other slices', () => {
		const registry = makeRegistry();
		const next = {
			...SEEDED_GEO.crawlers,
			blocked: { answer: [ 'perplexitybot' ], training: 'all' as const },
		};
		registry.dispatch( geoStore ).setCrawlers( next );
		expect( registry.select( geoStore ).getCrawlers() ).toEqual( next );
		expect( registry.select( geoStore ).getLlmsTxt() ).toEqual( SEEDED_GEO.llmsTxt );
		expect( registry.select( geoStore ).getEnhancer() ).toEqual( SEEDED_GEO.enhancer );
	} );
} );
