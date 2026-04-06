import { createReduxStore, register } from '@wordpress/data';

const DEFAULT_STATE = {
	loading: false,
	suggestions: {},
};

const actions = {
	startLoading() {
		return { type: 'START_LOADING' };
	},
	stopLoading() {
		return { type: 'STOP_LOADING' };
	},
	setSuggestion( slug, text ) {
		return { type: 'SET_SUGGESTION', slug, text };
	},
	clearSuggestion( slug ) {
		return { type: 'CLEAR_SUGGESTION', slug };
	},
	clearAllSuggestions() {
		return { type: 'CLEAR_ALL_SUGGESTIONS' };
	},
};

function reducer( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case 'START_LOADING':
			return { ...state, loading: true };
		case 'STOP_LOADING':
			return { ...state, loading: false };
		case 'SET_SUGGESTION':
			return {
				...state,
				suggestions: { ...state.suggestions, [ action.slug ]: action.text },
			};
		case 'CLEAR_SUGGESTION': {
			const suggestions = { ...state.suggestions };
			delete suggestions[ action.slug ];
			return { ...state, suggestions };
		}
		case 'CLEAR_ALL_SUGGESTIONS':
			return { ...state, suggestions: {} };
		default:
			return state;
	}
}

const selectors = {
	isLoading( state ) {
		return state.loading;
	},
	getSuggestion( state, slug ) {
		return state.suggestions[ slug ] || '';
	},
	hasSuggestion( state, slug ) {
		return !! state.suggestions[ slug ];
	},
	getAllSuggestions( state ) {
		return state.suggestions;
	},
	hasSuggestions( state ) {
		return Object.keys( state.suggestions ).length > 0;
	},
};

export const AI_STORE_NAME = 'jetpack/content-guidelines-ai';

export const aiStore = createReduxStore( AI_STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( aiStore );
