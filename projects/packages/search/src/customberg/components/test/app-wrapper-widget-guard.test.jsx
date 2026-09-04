import { render } from '@testing-library/react';
import SearchApp from 'instant-search/components/search-app';

jest.mock( 'instant-search/components/search-app', () => jest.fn( () => null ) );
jest.mock( 'hooks/use-search-options', () => jest.fn( () => ( {} ) ) );
jest.mock( 'hooks/use-loading-state', () => jest.fn( () => ( { isLoading: false } ) ) );
jest.mock( 'instant-search/store', () => ( {
	__esModule: true,
	default: { subscribe: jest.fn(), dispatch: jest.fn(), getState: () => ( {} ) },
} ) );
jest.mock( 'instant-search/lib/dom', () => ( { getThemeOptions: () => ( {} ) } ) );

describe( 'AppWrapper malformed widget config', () => {
	let AppWrapper;

	beforeAll( () => {
		// The module reads the server object at import time, so seed a
		// malformed value before importing.
		window.JetpackInstantSearchOptions = {
			webpackPublicPath: '/',
			widgets: { not: 'an array' },
			widgetsOutsideOverlay: 'nope',
			overlayOptions: {},
		};
		AppWrapper = require( '../app-wrapper' ).default;
	} );

	it( 'normalizes a malformed widgets/widgetsOutsideOverlay value instead of crashing', () => {
		render( <AppWrapper /> );

		const options = SearchApp.mock.calls.at( -1 )[ 0 ].options;
		expect( options.widgets ).toEqual( [] );
		expect( options.widgetsOutsideOverlay ).toEqual( [] );
	} );
} );
