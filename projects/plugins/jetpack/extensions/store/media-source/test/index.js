/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';
/**
 * Internal dependencies
 */
import storeDefinition from '../storeDefinition';

const { actions } = storeDefinition;
const STORE_ID = 'jetpack/media-source';

const setup = () => registerStore( STORE_ID, storeDefinition );

describe( 'save', () => {
	test( 'Initial State', () => {
		const store = setup();
		const got = store.getState();
		const want = { players: {} };
		expect( got ).toEqual( want );
	} );

	test( 'Add a player with default properties', () => {
		const store = setup();
		store.dispatch( actions.registerMediaSource( 100, {} ) );
		const got = store.getState();
		const want = {
			players: {
				100: { status: 'is-paused', position: 0 },
			},
		};
		expect( got ).toEqual( want );
	} );

	test( 'Add a player with one overriden property', () => {
		const store = setup();
		store.dispatch( actions.registerMediaSource( 100, { status: 'playing' } ) );
		const got = store.getState();
		const want = {
			players: {
				100: { status: 'playing', position: 0 },
			},
		};
		expect( got ).toEqual( want );
	} );

	test( 'Add two players, then update the first one', () => {
		const store = setup();
		store.dispatch( actions.registerMediaSource( 100, { status: 'playing' } ) );
		const stateAfterOneAction = store.getState();
		const frozenStateAfterOneAction = JSON.parse( JSON.stringify( stateAfterOneAction ) );

		store.dispatch( actions.registerMediaSource( 200, { status: 'stopped', position: 2 } ) );
		store.dispatch( actions.registerMediaSource( 100, { status: 'stopped', position: 1 } ) );
		const got = store.getState();
		const want = {
			players: {
				100: { status: 'stopped', position: 1 },
				200: { status: 'stopped', position: 2 },
			},
		};
		expect( stateAfterOneAction ).toEqual( frozenStateAfterOneAction );
		expect( got ).toEqual( want );
	} );

	test( 'Add two players, then delete one', () => {
		const store = setup();
		store.dispatch( actions.registerMediaSource( 100, { status: 'playing' } ) );
		const stateAfterOneAction = store.getState();
		const frozenStateAfterOneAction = JSON.parse( JSON.stringify( stateAfterOneAction ) );

		store.dispatch( actions.registerMediaSource( 200, { status: 'stopped' } ) );
		store.dispatch( actions.unregisterMediaSource( 100 ) );
		const got = store.getState();
		const want = {
			players: {
				200: { status: 'stopped', position: 0 },
			},
		};
		expect( stateAfterOneAction ).toEqual( frozenStateAfterOneAction );
		expect( got ).toEqual( want );
	} );
} );
