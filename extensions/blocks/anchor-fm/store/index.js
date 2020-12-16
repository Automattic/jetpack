/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

const DEFAULT_STATE = {
    players: {},
};

const actions = {
	registerMediaSource( id, playerState ) {
		return {
			type: 'REGISTER_MEDIA_PLAYER',
			id,
			playerState,
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

function getDefaultPlayerId( state ) {
	if ( state?.current ) {
		return state.current;
	}

	if ( Object.keys( state?.players )?.length ) {
		return Object.keys( state.players )?.[ 0 ];
	}

	return null;
}

const store = createReduxStore( 'jetpack/media-player-connector', {
    reducer( state = DEFAULT_STATE, action ) {
        switch ( action.type ) {
			case 'REGISTER_MEDIA_PLAYER':
				if ( state.players[ action?.id ] ) {
					// do not re-register.
					return state;
				}

				return {
					...state,
					current: action?.playerState?.current ? action.id : state.current,
					players: {
						...state.players,
						[ action.id ]: { id: action.id, ...action.playerState, current: undefined },
					},
				};

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

    selectors: {
		isPlaying( state ) {
			const id = getDefaultPlayerId( state );
            return state?.players[ id ]?.isPlaying;
		},

		getPosition( state ) {
			const id = getDefaultPlayerId( state );
            return state?.players[ id ]?.position;
		},

		isPlayingById( state, id ) {
            return state?.players[ id ]?.isPlaying;
		},

		getPositionById( state, id ) {
            return state?.players[ id ]?.position;
		},

		isPlayerRegistered( state, id ) {
			return !! state.players[ id ];
		}
    },
} );

register( store );