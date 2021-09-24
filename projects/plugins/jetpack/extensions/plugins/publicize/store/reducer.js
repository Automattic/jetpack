export const DEFAULT_STATE = {
	connections: [],
	tweets: [],
	twitterCards: [],
};

/**
 * Reducer managing Publicize connection test results.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 * @returns {object} Updated state.
 */
export default function ( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case 'SET_CONNECTION_TEST_RESULTS': {
			const { connections } = action;
			return {
				...state,
				connections,
			};
		}

		case 'REFRESH_CONNECTION_TEST_RESULTS': {
			const { connections } = action;
			return {
				...state,
				connections,
			};
		}

		case 'TOGGLE_CONNECTION_BY_ID': {
			/*
			 * Map connections re-defining the enabled state of the connection,
			 * based on the connection ID.
			 */
			const connections = state.connections.map( connection => ( {
				...connection,
				enabled: connection.id === action.connectionId ? ! connection.enabled : connection.enabled,
			} ) );

			return {
				...state,
				connections,
			};
		}

		case 'SET_TWEETS':
			return {
				...state,
				tweets: action.tweets,
			};
		case 'GET_TWITTER_CARDS': {
			const loadingCards = {};
			action.urls.forEach( url => ( loadingCards[ url ] = { error: 'loading' } ) );
			return {
				...state,
				twitterCards: {
					...state.twitterCards,
					...loadingCards,
				},
			};
		}
		case 'SET_TWITTER_CARDS':
			return {
				...state,
				twitterCards: {
					...state.twitterCards,
					...action.cards,
				},
			};
	}

	return state;
}
