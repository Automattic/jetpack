/**
 * Regression tests for the react-redux 9 infinite render loop in the
 * Recommendations onboarding init. See the `useInitOnboarding` comment in
 * ../index.jsx for the mechanism. These render the REAL connected components
 * with the REAL root reducer + REAL thunks (mocking only the network layer and
 * analytics) so the loop would reproduce here rather than only in e2e.
 */
import { jest } from '@jest/globals';
import { render as rtlRender, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router';
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import rootReducer from 'state/reducer';

const ONBOARDING_DATA_UPDATE = 'JETPACK_RECOMMENDATIONS_DATA_ONBOARDING_DATA_UPDATE';

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
 * conditional loaded, site data not fetching, no viewed recommendations, step
 * at 'site-type-question'.
 *
 * @param {object} dataOverrides - Extra keys merged into recommendations.data,
 *                               e.g. to activate an onboarding.
 * @return {object} Initial redux state.
 */
function buildInitialState( dataOverrides = {} ) {
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
					...dataOverrides,
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
 * Render the connected Recommendations onboarding with the real root reducer +
 * thunk, an action-counting middleware, and a MemoryRouter.
 *
 * @param {object} dataOverrides - Passed through to buildInitialState.
 * @return {object} Render helpers + dispatch counts.
 */
function renderRecommendations( dataOverrides = {} ) {
	const { Recommendations } = require( '../index' );

	const counts = {};
	const countingMiddleware = () => next => action => {
		counts[ action.type ] = ( counts[ action.type ] || 0 ) + 1;
		return next( action );
	};

	// `thunk` first so the counter only sees real dispatched actions, not the
	// thunk functions themselves.
	const store = createStore(
		rootReducer,
		buildInitialState( dataOverrides ),
		applyMiddleware( thunk, countingMiddleware )
	);

	const Wrapper = ( { children } ) => (
		<Provider store={ store }>
			<MemoryRouter initialEntries={ [ '/recommendations/site-type' ] }>{ children }</MemoryRouter>
		</Provider>
	);

	let renderError;
	try {
		rtlRender(
			<Routes>
				<Route path="/recommendations/*" element={ <Recommendations /> } />
			</Routes>,
			{ wrapper: Wrapper }
		);
	} catch ( e ) {
		renderError = e;
	}
	return { counts, renderError };
}

/* eslint jest/expect-expect: [ "warn", { assertFunctionNames: [ "expect", "expectNoLoop" ] } ] */
describe( 'Recommendations onboarding', () => {
	let errorSpy;

	beforeEach( () => {
		errorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );
	} );

	afterEach( () => {
		errorSpy.mockRestore();
	} );

	/**
	 * Assert no runaway render loop occurred and the onboarding init ran exactly
	 * once.
	 *
	 * @param {object} counts      - Dispatch counts by action type.
	 * @param {*}      renderError - Error thrown during render, if any.
	 */
	function expectNoLoop( counts, renderError ) {
		// The render must not throw, and React must not report a runaway update.
		expect( renderError ).toBeUndefined();
		const sawMaxUpdateDepth = errorSpy.mock.calls
			.map( call => String( call[ 0 ] ) )
			.some( message => message.includes( 'Maximum update depth' ) );
		expect( sawMaxUpdateDepth ).toBe( false );

		// The init ran exactly once: the loop dispatched this dozens of times.
		expect( counts[ ONBOARDING_DATA_UPDATE ] ).toBe( 1 );
		// Nothing else runs away either.
		const maxDispatches = Math.max( 0, ...Object.values( counts ) );
		expect( maxDispatches ).toBeLessThan( 10 );
	}

	it( 'renders the site-type question without an infinite render loop (viewed-sync branch)', async () => {
		// No onboarding active -> useInitOnboarding takes the else branch.
		const { counts, renderError } = renderRecommendations();

		// Let resolved thunk promises flush.
		await new Promise( res => setTimeout( res, 0 ) );

		expectNoLoop( counts, renderError );
		expect( screen.getByText( 'This is a personal site' ) ).toBeInTheDocument();
	} );

	it( 'starts an active onboarding without an infinite render loop (onboarding-start branch)', async () => {
		/*
		 * An active, not-yet-started onboarding -> useInitOnboarding takes the
		 * `active && !hasStarted` branch, which dispatches updateStep AND
		 * updateOnboardingData and mutates the loop-driving onboardingData object.
		 */
		const { counts, renderError } = renderRecommendations( {
			onboardingActive: 'JETPACK_BACKUP',
			onboardingHasStarted: false,
		} );

		await new Promise( res => setTimeout( res, 0 ) );

		expectNoLoop( counts, renderError );
	} );
} );
