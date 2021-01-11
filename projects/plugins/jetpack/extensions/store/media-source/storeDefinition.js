
/**
 * Internal dependencies
 */
import { STATE_PAUSED } from './constants';

const DEFAULT_STATE = {
	players: {},
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
						[ action.id ]: {
							id: action.id,
							...action.mediaSourceState,
						}
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
		}

		return state;
	},

	actions,

	selectors,
};
export default storeDefinition;
