/**
 * The At a Glance Boost card must not ask for a speed score until the site's
 * plugin data has settled, and never for a site that already runs Boost.
 * Renders the real connected card over the real root reducer.
 */
import { jest } from '@jest/globals';
import { render as rtlRender, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import {
	JETPACK_PLUGINS_DATA_FETCH,
	JETPACK_PLUGINS_DATA_FETCH_RECEIVE,
	JETPACK_PLUGINS_DATA_FETCH_FAIL,
} from 'state/action-types';
import rootReducer from 'state/reducer';
import DashBoost from '../index';

const mockRequestSpeedScores = jest.fn();
const mockScoreBarRenders = [];

jest.mock( '@automattic/jetpack-boost-score-api', () => ( {
	__esModule: true,
	requestSpeedScores: ( ...args ) => mockRequestSpeedScores( ...args ),
	getScoreLetter: () => 'B',
	// Any value past the 21-day cache window, so the card always asks for a fresh score.
	calculateDaysSince: () => 30,
} ) );

jest.mock( '@automattic/jetpack-components', () => {
	const actual = jest.requireActual( '@automattic/jetpack-components' );
	// Object-spreading the actual module throws on a re-export getter, so proxy it.
	return new Proxy( actual, {
		get: ( target, prop ) =>
			prop === 'BoostScoreBar'
				? props => {
						mockScoreBarRenders.push( { isLoading: props.isLoading, score: props.score } );
						return null;
				  }
				: target[ prop ],
	} );
} );

jest.mock( '@automattic/jetpack-api', () => ( {
	__esModule: true,
	default: new Proxy( {}, { get: () => () => Promise.resolve( {} ) } ),
} ) );

jest.mock( 'lib/analytics', () => ( {
	__esModule: true,
	default: { tracks: { recordEvent: () => {}, recordJetpackClick: () => {} } },
} ) );

const BOOST_PLUGINS_DATA = { 'jetpack-boost/jetpack-boost.php': { active: true } };

/**
 * State for an online, connected site; plugins data is left to the real reducer.
 *
 * @return {object} Initial redux state.
 */
function buildInitialState() {
	return {
		jetpack: {
			connection: {
				status: { siteConnected: { isActive: true, offlineMode: { isActive: false } } },
				user: { currentUser: { isConnected: true } },
				requests: {},
			},
			initialState: {
				rawUrl: 'example.com',
				WP_API_root: 'https://example.com/wp-json/',
				WP_API_nonce: 'nonce',
				siteData: {},
				userData: { currentUser: { permissions: { manage_modules: true } } },
			},
			siteData: { data: {} },
		},
	};
}

/**
 * Build a store over the real root reducer and render the connected card.
 *
 * @param {object} store - Redux store.
 * @return {import('@testing-library/react').RenderResult} Render result.
 */
function renderCard( store ) {
	return rtlRender(
		<Provider store={ store }>
			<DashBoost siteAdminUrl="https://example.com/wp-admin/" />
		</Provider>
	);
}

describe( 'DashBoost speed-score gating', () => {
	beforeEach( () => {
		mockRequestSpeedScores
			.mockReset()
			.mockResolvedValue( { current: { mobile: 80, desktop: 90 } } );
		mockScoreBarRenders.length = 0;
	} );

	test( 'does not request a speed score before plugin data has settled', () => {
		const store = createStore( rootReducer, buildInitialState(), applyMiddleware( thunk ) );
		renderCard( store );

		act( () => {
			store.dispatch( { type: JETPACK_PLUGINS_DATA_FETCH } );
		} );

		expect( mockRequestSpeedScores ).not.toHaveBeenCalled();
	} );

	test( 'never requests a speed score when plugin data reveals Boost', () => {
		const store = createStore( rootReducer, buildInitialState(), applyMiddleware( thunk ) );
		renderCard( store );

		act( () => {
			store.dispatch( { type: JETPACK_PLUGINS_DATA_FETCH } );
		} );
		act( () => {
			store.dispatch( {
				type: JETPACK_PLUGINS_DATA_FETCH_RECEIVE,
				pluginsData: BOOST_PLUGINS_DATA,
			} );
		} );

		expect( mockRequestSpeedScores ).not.toHaveBeenCalled();
	} );

	test( 'requests exactly one speed score once plugin data shows no Boost', async () => {
		const store = createStore( rootReducer, buildInitialState(), applyMiddleware( thunk ) );
		renderCard( store );

		act( () => {
			store.dispatch( { type: JETPACK_PLUGINS_DATA_FETCH } );
		} );
		await act( async () => {
			store.dispatch( { type: JETPACK_PLUGINS_DATA_FETCH_RECEIVE, pluginsData: {} } );
		} );

		expect( mockRequestSpeedScores ).toHaveBeenCalledTimes( 1 );
	} );

	test( 'a flag latched by an earlier failed fetch does not decide while a refetch is in flight', () => {
		const store = createStore( rootReducer, buildInitialState(), applyMiddleware( thunk ) );
		// An earlier route's fetch failed (flag latched true, items empty), and a refetch is in flight.
		store.dispatch( { type: JETPACK_PLUGINS_DATA_FETCH } );
		store.dispatch( { type: JETPACK_PLUGINS_DATA_FETCH_FAIL } );
		store.dispatch( { type: JETPACK_PLUGINS_DATA_FETCH } );

		renderCard( store );
		expect( mockRequestSpeedScores ).not.toHaveBeenCalled();

		act( () => {
			store.dispatch( {
				type: JETPACK_PLUGINS_DATA_FETCH_RECEIVE,
				pluginsData: BOOST_PLUGINS_DATA,
			} );
		} );

		expect( mockRequestSpeedScores ).not.toHaveBeenCalled();
	} );

	test( 'never paints the score bars with resting data before the scores arrive', async () => {
		let resolveScores;
		mockRequestSpeedScores.mockImplementation(
			() =>
				new Promise( resolve => {
					resolveScores = resolve;
				} )
		);
		const store = createStore( rootReducer, buildInitialState(), applyMiddleware( thunk ) );
		renderCard( store );

		act( () => {
			store.dispatch( { type: JETPACK_PLUGINS_DATA_FETCH } );
		} );
		await act( async () => {
			store.dispatch( { type: JETPACK_PLUGINS_DATA_FETCH_RECEIVE, pluginsData: {} } );
		} );

		// Bars are visible and the request is in flight: every committed frame must be a loading frame.
		expect( mockScoreBarRenders.length ).toBeGreaterThan( 0 );
		expect( mockScoreBarRenders.filter( r => ! r.isLoading ) ).toHaveLength( 0 );

		await act( async () => {
			resolveScores( { current: { mobile: 80, desktop: 90 } } );
		} );
		expect( mockScoreBarRenders.some( r => ! r.isLoading && r.score === 80 ) ).toBe( true );
	} );
} );
