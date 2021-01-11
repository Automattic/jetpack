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

	setMediaSourceAsDefault( id ) {
		return {
			type: 'SET_MEDIA_SOURCE_AS_DEFAULT',
			id,
		};
	}
};

const selectors = {};

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

			case 'SET_MEDIA_SOURCE_AS_DEFAULT': {
				return {
					...state,
					default: action.id,
				};
			}
		}

		return state;
	},

	actions,

	selectors,
};
export default storeDefinition;
