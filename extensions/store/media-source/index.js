/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore, register } from '@wordpress/data';
/**
 * Internal dependencies
 */
<<<<<<< HEAD
=======
import { STATE_PLAYING, STATE_PAUSED, STORE_ID } from './constants';

const DEFAULT_STATE = {
	default: null,
    players: {},
};

const defaultMediaStatus = {
	status: 'is-paused',
	position: 0,
};

const actions = {
	registerMediaSource( id, mediaStatus ) {
		return {
			type: 'REGISTER_MEDIA_SOURCE',
			id,
			status: { ...defaultMediaStatus, ...mediaStatus },
		};
	},

	unregisterMediaSource( id ) {
		return {
			type: 'UNREGISTER_MEDIA_SOURCE',
			id,
		};
	},

	setMediaSourceAsDefault( id ) {
		return {
			type: 'SET_MEDIA_SOURCE_AS_DEFAULT',
			id,
		};
	},

	playMediaSourceState( id ) {
		return {
			type: 'SET_MEDIA_PLAYER_STATE',
			id,
			state: STATE_PLAYING,
		};
	},

	pauseMediaSourceState( id ) {
		return {
			type: 'SET_MEDIA_PLAYER_STATE',
			id,
			state: STATE_PAUSED,
		};
	},
};

const selectors = {
	getDefaultMediaSource( state ) {
		let playerId = null;
		if ( state.default ) {
			playerId = state.default;
		} else if ( Object.keys( state.players ).length ) {
			playerId = state.players[ Object.keys[ 0 ] ].id;
		}

		if ( ! playerId ) {
			return;
		}
>>>>>>> bbc27f2... media-source-store: set via default ID

import storeDefinition from './storeDefinition';

<<<<<<< HEAD
/**
 * Internal dependencies
 */
import { STORE_ID } from './constants';
=======
const storeDefinition = {
    reducer( state = DEFAULT_STATE, action ) {
		const playerId = action.id || state.default;

		switch ( action.type ) {
			case 'REGISTER_MEDIA_SOURCE':
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: action.status,
					},
				};

			case 'UNREGISTER_MEDIA_SOURCE':
				// eslint-disable-next-line no-case-declarations
				const currentState = Object.assign( {}, state );
				if ( currentState.players[ action.id ] ) {
					delete currentState.players[ action.id ];
				}

				// Unset default if it's the case.
				if ( action.id === state.default ) {
					currentState.default = null;
				}
				return currentState;

			case 'SET_MEDIA_SOURCE_AS_DEFAULT':
				return {
					...state,
					default: action.id,
				};

			case 'SET_MEDIA_PLAYER_STATE':
				return {
					...state,
					players: {
						...state.players,
						[ playerId ]: {
							...state.players[ playerId ],
							state: action.state,
						},
					},
				};
		}

        return state;
    },

    actions,

    selectors,
};
>>>>>>> bbc27f2... media-source-store: set via default ID

// Register the store, considering the API changes.
if ( typeof createReduxStore !== 'undefined' ) {
	const store = createReduxStore( STORE_ID, storeDefinition );
	register( store );
} else {
	registerStore( STORE_ID, storeDefinition );
}
