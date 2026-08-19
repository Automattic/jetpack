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

	it( 'seeds the llms.txt state from the page bootstrap', () => {
		const registry = makeRegistry();
		expect( registry.select( aiStore ).getLlmsTxt() ).toEqual( SEEDED_AI.llmsTxt );
	} );

	it( 'replaces the llms.txt state on setLlmsTxt without touching other slices', () => {
		const registry = makeRegistry();
		const next = { enabled: true, url: SEEDED_AI.llmsTxt.url, canServe: true };
		registry.dispatch( aiStore ).setLlmsTxt( next );
		expect( registry.select( aiStore ).getLlmsTxt() ).toEqual( next );
		expect( registry.select( aiStore ).getEnhancer() ).toEqual( SEEDED_AI.enhancer );
	} );

	it( 'seeds the crawler state from the page bootstrap', () => {
		const registry = makeRegistry();
		expect( registry.select( aiStore ).getCrawlers() ).toEqual( SEEDED_AI.crawlers );
	} );

	it( 'replaces the crawler state on setCrawlers without touching other slices', () => {
		const registry = makeRegistry();
		const next = { ...SEEDED_AI.crawlers, overrides: { gptbot: false, perplexitybot: true } };
		registry.dispatch( aiStore ).setCrawlers( next );
		expect( registry.select( aiStore ).getCrawlers() ).toEqual( next );
		expect( registry.select( aiStore ).getLlmsTxt() ).toEqual( SEEDED_AI.llmsTxt );
		expect( registry.select( aiStore ).getEnhancer() ).toEqual( SEEDED_AI.enhancer );
	} );
} );
