export const DEFAULT_STATE = {
	tweets: [],
	twitterCards: [],
	postFeatureEnabled: false,
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
		case 'REFRESH_CONNECTION_TEST_RESULTS':
			return state;

		case 'TOGGLE_CONNECTION_BY_ID':
			return state;

		case 'TOGGLE_SHARE_POST_FEATURE':
			return {
				...state,
				postFeatureEnabled: ! state.postFeatureEnabled,
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
