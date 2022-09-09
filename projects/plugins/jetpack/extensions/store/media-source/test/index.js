import { registerStore } from '@wordpress/data';
import { STATE_PLAYING, STATE_PAUSED, STATE_ERROR } from '../constants';
import storeDefinition from '../store-definition';

const { actions } = storeDefinition;
const STORE_ID = 'jetpack/media-source';

const setup = () => registerStore( STORE_ID, storeDefinition );

describe( 'save', () => {
	test( 'Initial State', () => {
		const store = setup();
		const got = store.getState();
		const want = { sources: {}, default: null };
		expect( got ).toEqual( want );
	} );

	test( 'Add a player with default properties', () => {
		const store = setup();
		store.dispatch( actions.registerMediaSource( 100, {} ) );
		const got = store.getState();
		const want = {
			default: null,
			sources: {
				100: { id: 100 },
			},
		};
		expect( got ).toEqual( want );
	} );

	test( 'Add a player with one overriden property', () => {
		const store = setup();
		store.dispatch( actions.registerMediaSource( 100, { status: 'playing' } ) );
		const got = store.getState();
		const want = {
			default: null,
			sources: {
				100: { id: 100, status: 'playing' },
			},
		};
		expect( got ).toEqual( want );
	} );

	test( 'Add two sources, then update the first one', () => {
		const store = setup();
		store.dispatch( actions.registerMediaSource( 100, { status: 'playing' } ) );
		const stateAfterOneAction = store.getState();
		const frozenStateAfterOneAction = JSON.parse( JSON.stringify( stateAfterOneAction ) );

		store.dispatch( actions.registerMediaSource( 200, { status: 'stopped', position: 2 } ) );
		store.dispatch( actions.registerMediaSource( 100, { status: 'stopped', position: 1 } ) );
		const got = store.getState();
		const want = {
			default: null,
			sources: {
				100: { id: 100, status: 'stopped', position: 1 },
				200: { id: 200, status: 'stopped', position: 2 },
			},
		};
		expect( stateAfterOneAction ).toEqual( frozenStateAfterOneAction );
		expect( got ).toEqual( want );
	} );

	test( 'Add two sources, then delete one', () => {
		const store = setup();
		store.dispatch( actions.registerMediaSource( 100, { status: 'playing' } ) );
		const stateAfterOneAction = store.getState();
		const frozenStateAfterOneAction = JSON.parse( JSON.stringify( stateAfterOneAction ) );

		store.dispatch( actions.registerMediaSource( 200, { status: 'stopped' } ) );
		store.dispatch( actions.unregisterMediaSource( 100 ) );
		const got = store.getState();
		const want = {
			default: null,
			sources: {
				200: { id: 200, status: 'stopped' },
			},
		};
		expect( stateAfterOneAction ).toEqual( frozenStateAfterOneAction );
		expect( got ).toEqual( want );
	} );

	test( 'Set Default', () => {
		const store = setup();
		let got = store.getState();
		let want = { default: null, sources: {} };
		expect( got ).toEqual( want );

		store.dispatch( actions.setDefaultMediaSource( 5 ) );
		const stateAfterOneAction = store.getState();
		const frozenStateAfterOneAction = JSON.parse( JSON.stringify( stateAfterOneAction ) );

		got = store.getState();
		want = { default: 5, sources: {} };
		expect( got ).toEqual( want );

		store.dispatch( actions.setDefaultMediaSource( 10 ) );
		got = store.getState();
		want = { default: 10, sources: {} };
		expect( got ).toEqual( want );

		expect( stateAfterOneAction ).toEqual( frozenStateAfterOneAction );
	} );

	test( 'Error', () => {
		const store = setup();

		// Create sources
		store.dispatch( actions.registerMediaSource( 100, {} ) );

		let got = store.getState();
		let want = {
			default: null,
			sources: {
				100: { id: 100 },
			},
		};
		expect( got ).toEqual( want );

		// Set Error
		store.dispatch( actions.errorMediaSource( 100 ) );
		got = store.getState();
		want = {
			default: null,
			sources: {
				100: { id: 100, state: STATE_ERROR },
			},
		};
		expect( got ).toEqual( want );
	} );

	test( 'Set Time', () => {
		const store = setup();

		// Create sources
		store.dispatch( actions.registerMediaSource( 100, {} ) );
		const stateAfterOneAction = store.getState();
		const frozenStateAfterOneAction = JSON.parse( JSON.stringify( stateAfterOneAction ) );

		let got = store.getState();
		let want = {
			default: null,
			sources: {
				100: { id: 100 },
			},
		};
		expect( got ).toEqual( want );

		store.dispatch( actions.setMediaSourceCurrentTime( 100, 1000 ) );
		got = store.getState();
		want = {
			default: null,
			sources: {
				100: { id: 100, currentTime: 1000 },
			},
		};
		expect( got ).toEqual( want );

		store.dispatch( actions.setMediaSourceCurrentTime( 100, 2000 ) );
		got = store.getState();
		want = {
			default: null,
			sources: {
				100: { id: 100, currentTime: 2000 },
			},
		};
		expect( got ).toEqual( want );
		expect( stateAfterOneAction ).toEqual( frozenStateAfterOneAction );
	} );

	test( 'Play, Pause, Toggle', () => {
		const store = setup();

		// Create sources
		store.dispatch( actions.registerMediaSource( 100, {} ) );
		const stateAfterOneAction = store.getState();
		const frozenStateAfterOneAction = JSON.parse( JSON.stringify( stateAfterOneAction ) );

		let got = store.getState();
		let want = {
			default: null,
			sources: {
				100: { id: 100 },
			},
		};
		expect( got ).toEqual( want );

		// Set to Play
		store.dispatch( actions.playMediaSource( 100 ) );
		got = store.getState();
		want = {
			default: null,
			sources: {
				100: { id: 100, state: STATE_PLAYING },
			},
		};
		expect( got ).toEqual( want );

		// Set to Pause
		store.dispatch( actions.pauseMediaSource( 100 ) );
		got = store.getState();
		want = {
			default: null,
			sources: {
				100: { id: 100, state: STATE_PAUSED },
			},
		};
		expect( got ).toEqual( want );

		// Toggle (Pause -> Play)
		store.dispatch( actions.toggleMediaSource( 100 ) );
		got = store.getState();
		want = {
			default: null,
			sources: {
				100: { id: 100, state: STATE_PLAYING },
			},
		};
		expect( got ).toEqual( want );

		// Toggle (Play -> Pause)
		store.dispatch( actions.toggleMediaSource( 100 ) );
		got = store.getState();
		want = {
			default: null,
			sources: {
				100: { id: 100, state: STATE_PAUSED },
			},
		};
		expect( got ).toEqual( want );
		expect( stateAfterOneAction ).toEqual( frozenStateAfterOneAction );
	} );

	test( 'Toggle a player with no state', () => {
		const store = setup();

		// Create sources
		store.dispatch( actions.registerMediaSource( 100, {} ) );
		const stateAfterOneAction = store.getState();
		const frozenStateAfterOneAction = JSON.parse( JSON.stringify( stateAfterOneAction ) );

		let got = store.getState();
		let want = {
			default: null,
			sources: {
				100: { id: 100 },
			},
		};
		expect( got ).toEqual( want );

		// Toggle (? -> Play)
		store.dispatch( actions.toggleMediaSource( 100 ) );
		got = store.getState();
		want = {
			default: null,
			sources: {
				100: { id: 100, state: STATE_PLAYING },
			},
		};
		expect( got ).toEqual( want );
		expect( stateAfterOneAction ).toEqual( frozenStateAfterOneAction );
	} );
} );
