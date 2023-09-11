import { STATE_PLAYING, STATE_PAUSED, STATE_ERROR } from './constants';

const DEFAULT_STATE = {
	sources: {},
	default: null,
};

const actions = {
	registerMediaSource( id, mediaSourceState ) {
		return {
			type: 'REGISTER_MEDIA_SOURCE',
			id,
			mediaSourceState,
		};
	},

	updateMediaSourceData( id, data ) {
		return {
			type: 'UPDATE_MEDIA_SOURCE_DATA',
			id,
			data,
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

	toggleMediaSource( id ) {
		return {
			type: 'TOGGLE_MEDIA_PLAYER_STATE',
			id,
		};
	},

	pauseMediaSource( id ) {
		return {
			type: 'SET_MEDIA_PLAYER_STATE',
			id,
			state: STATE_PAUSED,
		};
	},

	errorMediaSource( id ) {
		return {
			type: 'SET_MEDIA_PLAYER_STATE',
			id,
			state: STATE_ERROR,
		};
	},

	setMediaSourceCurrentTime( id, currentTime ) {
		return {
			type: 'SET_MEDIA_PLAYER_CURRENT_TIME',
			id,
			currentTime,
		};
	},
};

const selectors = {
	getDefaultMediaSource( state ) {
		let playerId = null;
		const keys = Object.keys( state.sources );

		if ( state.default ) {
			playerId = state.default;
		} else if ( keys?.length ) {
			playerId = state.sources[ keys[ 0 ] ].id;
		}

		if ( ! playerId ) {
			return;
		}

		return state.sources[ playerId ];
	},

	getMediaPlayerState( state, id ) {
		const defaultMediaSource = id
			? state.sources?.[ id ]
			: selectors.getDefaultMediaSource( state );

		return defaultMediaSource?.state;
	},

	getMediaSourceCurrentTime( state, id ) {
		const defaultMediaSource = id
			? state.sources?.[ id ]
			: selectors.getDefaultMediaSource( state );

		return defaultMediaSource?.currentTime;
	},

	getMediaSourceDuration( state, id ) {
		if ( ! id ) {
			const defaultMediaSource = selectors.getDefaultMediaSource( state );
			return defaultMediaSource?.duration;
		}

		return state.sources?.[ id ]?.duration;
	},

	getMediaSourceDomReference( state, id ) {
		const defaultMediaSource = id
			? state.sources?.[ id ]
			: selectors.getDefaultMediaSource( state );

		if ( ! defaultMediaSource ) {
			return;
		}

		const domId = defaultMediaSource?.domId;
		if ( ! domId ) {
			return;
		}

		return document.getElementById( domId );
	},
};

const storeDefinition = {
	reducer( state = DEFAULT_STATE, action ) {
		// Some actions doesn't have defined the source ID
		// On this case, we try to get safe getting the default ID.
		// Othewise, it will try to pick the first fro the souces list.
		const actionId = action.id || state.default || Object.keys( state.sources )?.[ 0 ];

		switch ( action.type ) {
			case 'REGISTER_MEDIA_SOURCE': {
				return {
					...state,
					sources: {
						...state.sources,
						[ action.id ]: {
							id: action.id,
							...action.mediaSourceState,
						},
					},
				};
			}

			case 'UPDATE_MEDIA_SOURCE_DATA': {
				return {
					...state,
					sources: {
						...state.sources,
						[ action.id ]: {
							...state.sources[ action.id ],
							...action.data,
						},
					},
				};
			}

			case 'UNREGISTER_MEDIA_SOURCE': {
				const currentState = Object.assign( {}, state );
				if ( currentState.sources[ action.id ] ) {
					delete currentState.sources[ action.id ];
				}

				// Set the first source as default
				// if it's removing it.
				if ( action.id === state.default ) {
					currentState.default = Object.keys( state.sources )?.[ 0 ];
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
					sources: {
						...state.sources,
						[ actionId ]: {
							...state.sources[ actionId ],
							state: action.state,
						},
					},
				};
			}

			case 'TOGGLE_MEDIA_PLAYER_STATE': {
				return {
					...state,
					sources: {
						...state.sources,
						[ actionId ]: {
							...state.sources[ actionId ],
							state:
								state.sources[ actionId ].state === STATE_PLAYING ? STATE_PAUSED : STATE_PLAYING,
						},
					},
				};
			}

			case 'SET_MEDIA_PLAYER_CURRENT_TIME': {
				return {
					...state,
					sources: {
						...state.sources,
						[ actionId ]: {
							...state.sources[ actionId ],
							currentTime: action.currentTime,
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
