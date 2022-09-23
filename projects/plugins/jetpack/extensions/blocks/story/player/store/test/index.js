import { registerStore } from '@wordpress/data';
import * as actions from '../actions';
import { defaultPlayerState, defaultPlayerSettings, defaultCurrentSlideState } from '../constants';
import reducer from '../reducer';
import * as selectors from '../selectors';

const STORE_ID = 'jetpack/story/player';

const setup = () =>
	registerStore( STORE_ID, {
		actions,
		reducer,
		selectors,
	} );

describe( 'player', () => {
	test( 'Initial State', () => {
		const store = setup();
		expect( store.getState() ).toEqual( {} );
	} );

	test( 'Add a player with default properties', () => {
		const store = setup();
		store.dispatch( actions.init( 'player 1' ) );
		const got = store.getState();
		const want = {
			'player 1': defaultPlayerState,
		};
		expect( got ).toEqual( want );
	} );

	test( 'play and pause a story with default settings', () => {
		const store = setup();
		const playerId = 'player 1';
		store.dispatch( actions.init( playerId, { slideCount: 3 } ) );
		store.dispatch( actions.setPlaying( playerId, true ) );
		const got1 = store.getState();
		const want1 = {
			[ playerId ]: {
				...defaultPlayerState,
				settings: {
					...defaultPlayerSettings,
					slideCount: 3,
				},
				playing: true,
				fullscreen: true,
			},
		};
		expect( got1 ).toEqual( want1 );
		store.dispatch( actions.showSlide( playerId, 0 ) );
		const got2 = store.getState();
		const want2 = {
			[ playerId ]: {
				...want1[ playerId ],
				currentSlide: {
					...defaultCurrentSlideState,
				},
				previousSlide: {
					...defaultCurrentSlideState,
				},
			},
		};
		expect( got2 ).toEqual( want2 );
		const mediaElement = {};
		store.dispatch( actions.slideReady( playerId, mediaElement, 5 ) );
		const got3 = store.getState();
		const want3 = {
			[ playerId ]: {
				...want2[ playerId ],
				currentSlide: {
					...want2[ playerId ].currentSlide,
					duration: 5,
					ready: true,
					mediaElement,
				},
				previousSlide: null,
			},
		};
		expect( got3 ).toEqual( want3 );
		store.dispatch( actions.setCurrentSlideEnded( playerId ) );
		store.dispatch( actions.showSlide( playerId, 1 ) );
		const want4 = {
			[ playerId ]: {
				...want3[ playerId ],
				currentSlide: {
					...defaultCurrentSlideState,
				},
				previousSlide: {
					...want3[ playerId ].currentSlide,
				},
			},
		};
		store.dispatch( actions.slideReady( playerId, mediaElement, 5 ) );
		const got5 = store.getState();
		const want5 = {
			[ playerId ]: {
				...want4[ playerId ],
				currentSlide: {
					...want4[ playerId ].currentSlide,
					index: 1,
					duration: 5,
					ready: true,
					mediaElement,
				},
				previousSlide: null,
			},
		};
		expect( got5 ).toEqual( want5 );
	} );
} );
