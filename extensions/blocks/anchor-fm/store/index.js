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

	play( id ) {
		return {
			type: 'PLAY_MEDIA',
			id,
		};
	},

	stop( id ) {
		return {
			type: 'STOP_MEDIA',
			id,
		};
	},

	toggle( id ) {
		return {
			type: 'TOGGLE_MEDIA',
			id,
		};
	},
};

const store = createReduxStore( 'jetpack/media-player-connector', {
    reducer( state = DEFAULT_STATE, action ) {
        switch ( action.type ) {
			case 'REGISTER_MEDIA_PLAYER':
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: { id: action.id, ...action.playerState },
					},
				};

			case 'PLAY_MEDIA':
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							isPlaying: true,
						},
					},
				};

			case 'STOP_MEDIA':
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							isPlaying: false,
						},
					},
				};

			case 'TOGGLE_MEDIA':
				return {
					...state,
					players: {
						...state.players,
						[ action.id ]: {
							...state.players[ action.id ],
							isPlaying: ! state.players[ action.id ].isPlaying,
						},
					},
				};
        }

        return state;
    },

    actions,

    selectors: {
        getPlayer( state ) {
			const id = Object.keys( state.players )?.[ 0 ];
            return state.players[ id ];
		},

		isPlaying( state, id ) {
            return state?.players[ id ]?.isPlaying;
        },
    },
} );

register( store );