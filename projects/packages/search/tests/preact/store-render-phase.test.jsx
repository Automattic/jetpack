/**
 * Runs react-redux against preact/compat, the way the Instant Search bundle ships.
 *
 * Mounts with preact's own `render`, matching src/instant-search/index.jsx, so this
 * exercises the production pairing rather than React 18 like the main Jest config.
 */

import { render } from 'preact';
import { connect, Provider } from 'react-redux';
import { applyMiddleware, createStore } from 'redux';
import refx from 'refx';

const reducer = ( state = { value: 'initial', ticks: 0 }, action ) => {
	switch ( action.type ) {
		case 'SET_VALUE':
			return { ...state, value: action.value };
		case 'TICK':
			return { ...state, ticks: state.ticks + 1 };
		default:
			return state;
	}
};

// No preloaded state — passing `{}` would shadow the reducer's own defaults.
const makeStore = ( effects = {} ) => createStore( reducer, applyMiddleware( refx( effects ) ) );

// Preact batches re-renders into a microtask, so let it flush before asserting.
const flush = () => new Promise( resolve => setTimeout( resolve, 0 ) );

let container;

beforeEach( () => {
	container = document.createElement( 'div' );
	document.body.appendChild( container );
} );

afterEach( () => {
	render( null, container );
	container.remove();
} );

describe( 'react-redux under preact/compat', () => {
	it( 'renders connected state and re-renders on dispatch', async () => {
		const store = makeStore();
		const Display = connect( state => ( { value: state.value } ) )( ( { value } ) => (
			<span>{ value }</span>
		) );

		render(
			<Provider store={ store }>
				<Display />
			</Provider>,
			container
		);
		expect( container ).toHaveTextContent( 'initial' );

		store.dispatch( { type: 'SET_VALUE', value: 'updated' } );
		await flush();

		expect( container ).toHaveTextContent( 'updated' );
	} );

	it( 'shows a store seeded before the first render, with no catch-up render', () => {
		const store = makeStore();
		store.dispatch( { type: 'SET_VALUE', value: 'seeded' } );

		let timesRendered = 0;
		const Display = connect( state => ( { value: state.value } ) )( ( { value } ) => {
			timesRendered++;
			return <span>{ value }</span>;
		} );

		render(
			<Provider store={ store }>
				<Display />
			</Provider>,
			container
		);

		// Seeding before mount is what src/instant-search/index.jsx does, so the value
		// must be correct on the first paint and cost exactly one render.
		expect( container ).toHaveTextContent( 'seeded' );
		expect( timesRendered ).toBe( 1 );
	} );

	it( 'stops re-rendering once unmounted', async () => {
		const store = makeStore();
		let timesRendered = 0;
		const Display = connect( state => ( { value: state.value } ) )( ( { value } ) => {
			timesRendered++;
			return <span>{ value }</span>;
		} );

		render(
			<Provider store={ store }>
				<Display />
			</Provider>,
			container
		);
		// eslint-disable-next-line testing-library/render-result-naming-convention -- preact's render() returns void; this is a render counter, not its result.
		const countAtUnmount = timesRendered;

		render( null, container );
		store.dispatch( { type: 'SET_VALUE', value: 'after-unmount' } );
		await flush();

		expect( timesRendered ).toBe( countAtUnmount );
	} );

	it( 'settles instead of looping when an effect dispatches on every action', async () => {
		// refx effects dispatch from outside React, which is how store/effects.js drives
		// search requests. A bounded cascade must settle rather than run away.
		const store = makeStore( {
			SET_VALUE: ( action, s ) => {
				if ( s.getState().ticks < 3 ) {
					s.dispatch( { type: 'TICK' } );
					s.dispatch( { type: 'SET_VALUE', value: `v${ s.getState().ticks }` } );
				}
			},
		} );

		const Display = connect( state => ( { ticks: state.ticks } ) )( ( { ticks } ) => (
			<span>ticks:{ ticks }</span>
		) );

		render(
			<Provider store={ store }>
				<Display />
			</Provider>,
			container
		);

		store.dispatch( { type: 'SET_VALUE', value: 'go' } );
		await flush();

		expect( container ).toHaveTextContent( 'ticks:3' );
	} );
} );
