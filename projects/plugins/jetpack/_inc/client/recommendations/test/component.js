/**
 * Regression test for the react-redux 9 infinite render loop
 * ("Maximum update depth exceeded") in the Recommendations onboarding flow.
 *
 * The `useInitOnboarding` hook in ../index.jsx dispatches from an effect that
 * depends on `onboardingData` — a fresh object on every store change. Under
 * react-redux 9 (useSyncExternalStore) that dispatch forces a synchronous
 * re-render in which a `useState` guard never latches, so the effect dispatched
 * in an infinite loop and the onboarding never rendered. The guard is now a ref.
 *
 * This renders the REAL connected components with the REAL root reducer + REAL
 * thunks, mocking only the network layer (@automattic/jetpack-api) and analytics,
 * so a regression would reproduce the loop here rather than only in e2e.
 */
import { jest } from '@jest/globals';
import { render as rtlRender, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router';
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import rootReducer from 'state/reducer';

/* Mock ONLY the network layer. Every restApi method resolves immediately. */
jest.mock( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: new Proxy(
		{},
		{
			get: () => () => Promise.resolve( {} ),
		}
	),
} ) );

/* Mock analytics so recordEvent is a no-op. */
jest.mock( 'lib/analytics', () => ( {
	__esModule: true,
	default: {
		tracks: { recordEvent: () => {} },
		setMcAnalyticsEnabled: () => {},
	},
} ) );

/**
 * Build an initial state mimicking the e2e scenario: recommendations data +
 * conditional loaded, site data not fetching, no onboarding active, no viewed
 * recommendations, step at 'site-type-question'.
 *
 * @return {object} Initial redux state.
 */
function buildInitialState() {
	return {
		jetpack: {
			initialState: {
				recommendationsStep: 'site-type-question',
				newRecommendations: [],
				siteTitle: 'Test Site',
				userData: { currentUser: { permissions: {} } },
			},
			pluginsData: {
				items: {
					'jetpack/jetpack.php': { active: true },
				},
			},
			recommendations: {
				step: 'site-type-question',
				data: {
					'site-type-store': true,
					'site-type-agency': true,
					viewedRecommendations: [],
					skippedRecommendations: [],
					selectedRecommendations: [],
					onboardingViewed: [],
				},
				requests: {
					isRecommendationsDataLoaded: true,
					isRecommendationsConditionalLoaded: true,
					isFetchingRecommendationsData: false,
					isFetchingRecommendationsConditional: false,
					isFetchingRecommendationsProductSuggestions: false,
					isUpdatingRecommendationsStep: false,
				},
				conditional: [],
				productSuggestions: [],
				upsell: {},
				siteDiscount: {},
				installing: {},
			},
			settings: { items: [] },
			siteData: {
				requests: {
					isFetchingSiteData: false,
					isFetchingSiteDiscount: false,
				},
				data: {
					plan: { product_slug: 'jetpack_free' },
					sitePurchases: [],
				},
			},
			siteProducts: { items: {} },
			introOffers: { requests: { isFetching: false } },
		},
	};
}

/**
 * Render UI with the real root reducer + thunk, an action-counting middleware,
 * and a MemoryRouter.
 *
 * @param {import('react').ReactElement} ui    - Element to render.
 * @param {string}                       route - Initial route.
 * @return {object} Render helpers + dispatch counts.
 */
function renderWithStore( ui, route = '/recommendations/site-type' ) {
	const counts = {};
	const countingMiddleware = () => next => action => {
		counts[ action.type ] = ( counts[ action.type ] || 0 ) + 1;
		return next( action );
	};

	// `thunk` first so the counter only sees real dispatched actions, not the
	// thunk functions themselves.
	const store = createStore(
		rootReducer,
		buildInitialState(),
		applyMiddleware( thunk, countingMiddleware )
	);

	const Wrapper = ( { children } ) => (
		<Provider store={ store }>
			<MemoryRouter initialEntries={ [ route ] }>{ children }</MemoryRouter>
		</Provider>
	);

	let renderError;
	try {
		rtlRender( ui, { wrapper: Wrapper } );
	} catch ( e ) {
		renderError = e;
	}
	return { counts, renderError };
}

describe( 'Recommendations onboarding', () => {
	let errorSpy;

	beforeEach( () => {
		errorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		errorSpy.mockRestore();
	} );

	it( 'renders the site-type question without an infinite render loop', async () => {
		const { Recommendations } = require( '../index' );

		const { counts, renderError } = renderWithStore(
			<Routes>
				<Route path="/recommendations/*" element={ <Recommendations /> } />
			</Routes>
		);

		// Let resolved thunk promises flush.
		await new Promise( res => setTimeout( res, 0 ) );

		// The render must not throw, and React must not report a runaway update.
		expect( renderError ).toBeUndefined();
		const sawMaxUpdateDepth = errorSpy.mock.calls
			.map( call => String( call[ 0 ] ) )
			.some( message => message.includes( 'Maximum update depth' ) );
		expect( sawMaxUpdateDepth ).toBe( false );

		// No action should fire more than a handful of times (the loop dispatched
		// the onboarding-data update dozens of times).
		const maxDispatches = Math.max( 0, ...Object.values( counts ) );
		expect( maxDispatches ).toBeLessThan( 10 );

		// The step actually renders its checkboxes.
		expect( screen.getByText( 'This is a personal site' ) ).toBeInTheDocument();
	} );
} );
