/* eslint-disable testing-library/no-unnecessary-act -- Preact render does not wrap updates in act. */
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { search } from '../../src/instant-search/lib/api';

jest.mock( '../../src/instant-search/set-webpack-public-path', () => ( {} ) );
jest.mock( '../../src/instant-search/lib/api', () => ( {
	buildFilterAggregations: jest.fn( () => ( {} ) ),
	search: jest.fn( () => new Promise( () => {} ) ),
} ) );
jest.mock( '../../src/instant-search/components/search-results', () => () => null );
jest.mock(
	'../../src/instant-search/components/overlay',
	() =>
		( { children } ) =>
			children
);
jest.mock( '../../src/instant-search/components/dom-event-handler', () => () => null );
jest.mock( '../../src/instant-search/components/customizer-event-handler', () => () => null );
jest.mock( '@microsoft/fetch-event-source', () => ( { fetchEventSource: jest.fn() } ) );

it( 'requests the URL query, filters, and sort on the first mount', async () => {
	jest.useFakeTimers();
	window.history.replaceState( {}, '', '/?s=block&post_types=page&sort=newest' );
	window.JetpackInstantSearchOptions = {
		siteId: 123,
		disableTracking: true,
		aiAnswersEnabled: false,
		widgets: [],
		widgetsOutsideOverlay: [],
		overlayOptions: { defaultSort: 'relevance', resultFormat: 'minimal' },
	};

	try {
		const { initialize } = require( '../../src/instant-search' );
		await act( () => initialize() );
		await act( () => jest.advanceTimersByTime( 500 ) );

		expect( search ).toHaveBeenCalledTimes( 1 );
		expect( search ).toHaveBeenCalledWith(
			expect.objectContaining( {
				query: 'block',
				filter: { post_types: [ 'page' ] },
				sort: 'newest',
			} ),
			expect.any( Number )
		);
	} finally {
		await act( () => render( null, document.body ) );
		jest.useRealTimers();
		window.history.replaceState( {}, '', '/' );
		delete window.JetpackInstantSearchOptions;
	}
} );
