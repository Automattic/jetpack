/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore, register } from '@wordpress/data';

export const STORE_ID = 'jetpack/media-source';

const DEFAULT_STATE = {
    players: {},
};

const actions = {
	registerMediaSource( id, mediaState ) {
		return {
			type: 'REGISTER_MEDIA_SOURCE',
			id,
			mediaState,
		};
	},

	unregisterMediaSource( id ) {
		return {
			type: 'UNREGISTER_MEDIA_SOURCE',
			id,
		};
	},
};

const selectors = {};

const storeDefinition = {
    reducer( state = DEFAULT_STATE, action ) {
        switch ( action.type ) {
			case 'REGISTER_MEDIA_SOURCE':
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: { id: action.id, ...action.mediaState },
					},
				};

			case 'UNREGISTER_MEDIA_SOURCE':
				// eslint-disable-next-line no-case-declarations
				const currentState = Object.assign( {}, state );
				if ( currentState.players[ action.id ] ) {
					delete currentState.players[ action.id ];
				}
				return currentState;
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
