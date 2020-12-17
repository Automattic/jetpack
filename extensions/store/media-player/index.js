/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore, register } from '@wordpress/data';

console.log( 'registerStore: ', registerStore );

/**
 * Internal dependencies
 */
// import {
// 	STATE_PAUSED,
// 	STATE_PLAYING,
// } from '../../shared/components/audio-player/constants';

export const STORE_ID = 'jetpack/media-player';

const DEFAULT_STATE = {
    players: {},
};

function getDefaultPlayerId( state ) {
	if ( state?.current ) {
		return state.current;
	}

	if ( Object.keys( state.players )?.length ) {
		return Object.keys( state.players )?.[ 0 ];
	}

	return null;
}

const actions = {
	registerMediaSource( id, playerState ) {
		return {
			type: 'REGISTER_MEDIA_PLAYER',
			id,
			playerState,
		};
	},

	unregisterMediaSource( id ) {
		return {
			type: 'UNREGISTER_MEDIA_PLAYER',
			id,
		};
	},

	play() {
		return {
			type: 'PLAY_MEDIA',
		};
	},

	stop() {
		return {
			type: 'STOP_MEDIA',
		};
	},

	toggle() {
		return {
			type: 'TOGGLE_MEDIA',
		};
	},

	moveTo( position ) {
		return {
			type: 'SET_PLAYER_POSITION',
			position,
		};
	},

	moveBack( ) {
		return {
			type: 'MOVE_PLAYER_BACK',
		};
	},

	moveForward() {
		return {
			type: 'MOVE_PLAYER_FORWARD',
		};
	}
};

const selectors = {
	isPlaying( state ) {
		const id = getDefaultPlayerId( state );
		return state.players[ id ]?.isPlaying;
	},

	getPosition( state ) {
		const id = getDefaultPlayerId( state );
		return state.players[ id ]?.position;
	},

	isPlayingById( state, id ) {
		return state.players?.[ id ]?.isPlaying;
	},

	getPositionById( state, id ) {
		return state.players?.[ id ]?.position;
	},
};

const storeDefinition = {
    reducer( state = DEFAULT_STATE, action ) {
        switch ( action.type ) {
			case 'REGISTER_MEDIA_PLAYER':
				return {
					...state,
					current: action?.playerState?.current ? action.id : state.current,
					players: {
						...state.players,
						[ action.id ]: { id: action.id, ...action.playerState, current: undefined },
					},
				};

			case 'UNREGISTER_MEDIA_PLAYER':
				// eslint-disable-next-line no-case-declarations
				const currentState = Object.assign( {}, state );
				if ( currentState.players[ action.id ] ) {
					delete currentState.players[ action.id ];
				}
				return currentState;

			case 'PLAY_MEDIA':
				return {
					...state,
					players: {
						...state.players,
						[ state.current ]: {
							...state.players[ state.current ],
							isPlaying: true,
						},
					},
				};

			case 'STOP_MEDIA':
				return {
					...state,
					players: {
						...state.players,
						[ state.current ]: {
							...state.players[ state.current ],
							isPlaying: false,
						},
					},
				};

			case 'TOGGLE_MEDIA':
				return {
					...state,
					players: {
						...state.players,
						[ state.current ]: {
							...state.players[ state.current ],
							isPlaying: ! state.players[ state.current ].isPlaying,
						},
					},
				};

			case 'SET_PLAYER_POSITION':
				return {
					...state,
					players: {
						...state.players,
						[ state.current ]: {
							...state.players[ state.current ],
							position: action.position,
						},
					},
				};

			case 'MOVE_PLAYER_BACK':
				return {
					...state,
					players: {
						...state.players,
						[ state.current ]: {
							...state.players[ state.current ],
							position: state.players[ state.current ].position - 5,
						},
					},
				};

			case 'MOVE_PLAYER_FORWARD':
				return {
					...state,
					players: {
						...state.players,
						[ state.current ]: {
							...state.players[ state.current ],
							position: state.players[ state.current ].position + 5,
						},
					},
				};
        }

        return state;
    },

    actions,

    selectors,
};

if ( typeof createReduxStore !== 'undefined' ) {
	const store = createReduxStore( STORE_ID, storeDefinition );
	register( store );
} else {
	registerStore( STORE_ID, storeDefinition );
}