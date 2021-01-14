/**
 * Internal dependencies
 */
import { STATE_PLAYING, STATE_PAUSED, STATE_ERROR } from './constants';

const DEFAULT_STATE = {
	players: {},
};

const defaultMediaSourceData = {
	state: 'is-paused',
	currentTime: 0,
};

const actions = {
	registerMediaSource( id, data ) {
		return {
			type: 'REGISTER_MEDIA_SOURCE',
			id,
			data: { ...defaultMediaSourceData, ...data },
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

	playMediaSource( id ) {
		return {
			type: 'SET_MEDIA_PLAYER_STATE',
			id,
			state: STATE_PLAYING,
		};
	},

	pauseMediaSource( id ) {
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

	toggleMediaSource( id ) {
		return {
			type: 'TOGGLE_MEDIA_PLAYER_STATE',
			id,
		};
	},

	setMediaSourceCurrentTime( id, currentTime ) {
		return {
			type: 'SET_MEDIA_PLAYER_CURRENT_TIME',
			id,
			currentTime,
		};
	},

	// moveMediaSourceCurrentTime( id, currentTime ) {
	// 	return actions.setMediaSourceCurrentTime( id, String( currentTime ) );
	// },

	setMediaElementDomReference( id, domRefId ) {
		return {
			type: 'SET_MEDIA_SOURCE_DOM_REFERENCE',
			id,
			domRefId,
		};
	}
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
	},

	getMediaSourceCurrentTime( state, id ) {
		if ( ! id ) {
			const defaultMediaSource = selectors.getDefaultMediaSource( state );
			return defaultMediaSource?.currentTime;
		}

		return state.players?.[ id ]?.currentTime;
	},

	getMediaElementDomReference( state, id ) {
		if ( ! id ) {
			const defaultMediaSource = selectors.getDefaultMediaSource( state );
			return defaultMediaSource?.domRefId;
		}

		return state.players?.[ id ]?.domRefId;
	},
};

const storeDefinition = {
	reducer( state = DEFAULT_STATE, action ) {
		switch ( action.type ) {
			case 'REGISTER_MEDIA_SOURCE': {
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							id: action.id,
							...action.data,
						},
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

			case 'SET_MEDIA_PLAYER_CURRENT_TIME': {
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							currentTime: action.currentTime,
						},
					},
				};
			}

			case 'SET_MEDIA_SOURCE_DOM_REFERENCE': {
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							domRefId: action.domRefId,
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
