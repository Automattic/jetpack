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
			// Combine current connections with new connections.
			const { connections: prevConnections } = state;
			const prevConnectionIds = prevConnections.map( connection => connection.id );

			const { results: freshConnections } = action;

			const connections = [];
			for ( const freshConnection of freshConnections ) {
				let connection;
				if ( prevConnectionIds.includes( freshConnection.id ) ) {
					/*
					 * The connection is already defined.
					 * Do not overwrite the existing connection.
					 */
					connection = prevConnections.filter(
						prevConnection => prevConnection.id === freshConnection.id
					)[ 0 ];
				} else {
					/*
					 * Here the connection is new.
					 * Let's map it.
					 */
					connection = {
						display_name: freshConnection.display_name,
						service_name: freshConnection.service_name,
						id: freshConnection.id,
						done: false,
						enabled: true,
						toggleable: true,
					};
				}

				// Populate the connection with extra fresh data.
				if ( freshConnection.profile_picture ) {
					connection.profile_picture = freshConnection.profile_picture;
				}

				connections.push( connection );
			}

			return {
				...state,
				connections,
			};
		}

		case 'REFRESH_CONNECTION_TEST_RESULTS':
			return {
				...state,
				connections: action.results,
			};
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
