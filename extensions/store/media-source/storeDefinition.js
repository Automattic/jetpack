/**
 * Internal dependencies
 */
import { STATE_PLAYING, STATE_PAUSED, STATE_ERROR } from './constants';

const DEFAULT_STATE = {
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

	setDefaultMediaSource( id ) {
		return {
			type: 'SET_DEFAULT_MEDIA_SOURCE',
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

	errorMediaSourceState( id ) {
		return {
			type: 'SET_MEDIA_PLAYER_STATE',
			id,
			state: STATE_ERROR,
		};
	},

	toggleMediaSourceState( id ) {
		return {
			type: 'TOGGLE_MEDIA_PLAYER_STATE',
			id,
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

		return state.players[ playerId ];
	},

	getMediaPlayerStatus( state, id ) {
		if ( ! id ) {
			const defaultMediaSource = selectors.getDefaultMediaSource( state );
			return defaultMediaSource?.state;
		}

		return state.players?.[ id ]?.state;
	}
};

const storeDefinition = {
	reducer( state = DEFAULT_STATE, action ) {
		switch ( action.type ) {
			case 'REGISTER_MEDIA_SOURCE': {
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: action.status,
					},
				};
			}

			case 'UNREGISTER_MEDIA_SOURCE': {
				const currentState = Object.assign( {}, state );
				if ( currentState.players[ action.id ] ) {
					delete currentState.players[ action.id ];
				}

				// Unset default if it's the case.
				if ( action.id === state.default ) {
					currentState.default = null;
				}
				return currentState;
			}

			case 'SET_DEFAULT_MEDIA_SOURCE': {
				return {
					...state,
					default: action.id,
				};
			}

			case 'SET_MEDIA_PLAYER_STATE': {
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							state: action.state,
						},
					},
				};
			}

			case 'TOGGLE_MEDIA_PLAYER_STATE': {
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							state: state.players[ action.id ].state === STATE_PLAYING
								? STATE_PAUSED
								: STATE_PLAYING,
						},
					},
				};
			}
		}

        return state;
    },

    actions,

    selectors,
};

export default storeDefinition;
