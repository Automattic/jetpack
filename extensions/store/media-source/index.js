/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore, register } from '@wordpress/data';

export const STORE_ID = 'jetpack/media-source';

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

	playMediaSource( id ) {
		return {
			type: 'PLAY_MEDIA_SOURCE',
			id,
			status: 'is-playing'
		};
	},

	stopMediaSource( id ) {
		return {
			type: 'STOP_MEDIA_SOURCE',
			id,
			status: 'is-playing'
		};
	},

	toggleMediaSource( id ) {
		return {
			id,
			type: 'TOGGLE_MEDIA_SOURCE',
		};
	}
};

const selectors = {
	getCurrent( state ) {
		if ( ! Object.keys( state.players ).length ) {
			return;
		}

		return state.players[ Object.keys( state.players )[ 0 ] ];
	},

	getMediaSource( state, id ) {
		return state.players?.[ id ];
	}
};

const storeDefinition = {
    reducer( state = DEFAULT_STATE, action ) {
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
				return currentState;

			case 'PLAY_MEDIA_SOURCE':
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							status: 'is-playing',
						},
					},
				};

			case 'STOP_MEDIA_SOURCE':
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							status: 'is-paused',
						},
					},
				};

			case 'TOGGLE_MEDIA_SOURCE':
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							status: state.players[ action.id ].status !== 'is-playing'
								? 'is-playing'
								: 'is-paused',
						},
					},
				};
		}

        return state;
    },

    actions,

    selectors,
};

// Register the store, considering the API changes.
if ( typeof createReduxStore !== 'undefined' ) {
	const store = createReduxStore( STORE_ID, storeDefinition );
	register( store );
} else {
	registerStore( STORE_ID, storeDefinition );
}
