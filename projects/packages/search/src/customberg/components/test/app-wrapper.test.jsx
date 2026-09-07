import { render } from '@testing-library/react';
import useSearchOptions from 'hooks/use-search-options';
import SearchApp from 'instant-search/components/search-app';

jest.mock( 'instant-search/components/search-app', () => jest.fn( () => null ) );
jest.mock( 'hooks/use-search-options', () => jest.fn( () => ( {} ) ) );
jest.mock( 'hooks/use-loading-state', () => jest.fn( () => ( { isLoading: false } ) ) );
jest.mock( 'instant-search/store', () => ( {
	__esModule: true,
	default: { subscribe: jest.fn(), dispatch: jest.fn(), getState: () => ( {} ) },
} ) );
jest.mock( 'instant-search/lib/api', () => ( { buildFilterAggregations: () => ( {} ) } ) );
jest.mock( 'instant-search/lib/dom', () => ( { getThemeOptions: () => ( {} ) } ) );

const makeServerObject = ( overrides = {} ) => ( {
	webpackPublicPath: '/',
	widgets: [],
	widgetsOutsideOverlay: [],
	overlayOptions: {},
	aiAnswersEnabled: false,
	...overrides,
} );

describe( 'AppWrapper AI Answers preview gating', () => {
	let AppWrapper;

	const searchAppOptions = () => SearchApp.mock.calls.at( -1 )[ 0 ].options;

	beforeAll( () => {
		// The module reads the server object at import time, so seed it first.
		window.JetpackInstantSearchOptions = makeServerObject();
		AppWrapper = require( '../app-wrapper' ).default;
	} );

	beforeEach( () => {
		SearchApp.mockClear();
	} );

	it( 'feeds the preview the enforced value while the master is off', () => {
		// A saved-on choice persists while the master is off, so the raw
		// entity value can be true — the preview must not stream on it.
		window.JetpackInstantSearchOptions = makeServerObject( { aiMasterEnabled: false } );
		useSearchOptions.mockReturnValue( { aiAnswersEnabled: true } );

		render( <AppWrapper /> );

		expect( searchAppOptions().aiAnswersEnabled ).toBe( false );
	} );

	it( 'lets the sidebar toggle drive the preview while the master is on', () => {
		window.JetpackInstantSearchOptions = makeServerObject( { aiMasterEnabled: true } );
		useSearchOptions.mockReturnValue( { aiAnswersEnabled: true } );

		render( <AppWrapper /> );

		expect( searchAppOptions().aiAnswersEnabled ).toBe( true );
	} );

	it( 'defaults to ungated when the server object predates the master flag', () => {
		window.JetpackInstantSearchOptions = makeServerObject();
		useSearchOptions.mockReturnValue( { aiAnswersEnabled: true } );

		render( <AppWrapper /> );

		expect( searchAppOptions().aiAnswersEnabled ).toBe( true );
	} );

	it( 'falls back to the server value when the sidebar has no local edit', () => {
		window.JetpackInstantSearchOptions = makeServerObject( {
			aiMasterEnabled: true,
			aiAnswersEnabled: true,
		} );
		useSearchOptions.mockReturnValue( {} );

		render( <AppWrapper /> );

		expect( searchAppOptions().aiAnswersEnabled ).toBe( true );
	} );
} );
