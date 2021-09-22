export const DEFAULT_STATE = {
	tweets: [],
	twitterCards: [],
};

/**
 * Publicize reducer.
 *
 * @param {object} state - Current state.
 * @param {object} action - Dispatched action.
 * @returns {object} Updated state.
 */
export default function ( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case 'TOGGLE_CONNECTION_BY_ID': {
			return state;
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
