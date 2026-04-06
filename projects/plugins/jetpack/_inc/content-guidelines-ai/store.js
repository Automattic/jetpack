import { createReduxStore, register } from '@wordpress/data';

const DEFAULT_STATE = {
	loading: false,
	loadingSections: {},
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
	startSectionLoading( slug ) {
		return { type: 'START_SECTION_LOADING', slug };
	},
	stopSectionLoading( slug ) {
		return { type: 'STOP_SECTION_LOADING', slug };
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
		case 'START_SECTION_LOADING':
			return {
				...state,
				loadingSections: { ...state.loadingSections, [ action.slug ]: true },
			};
		case 'STOP_SECTION_LOADING': {
			const loadingSections = { ...state.loadingSections };
			delete loadingSections[ action.slug ];
			return { ...state, loadingSections };
		}
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
	isSectionLoading( state, slug ) {
		return state.loading || !! state.loadingSections[ slug ];
	},
};

export const AI_STORE_NAME = 'jetpack/content-guidelines-ai';

const aiStore = createReduxStore( AI_STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( aiStore );
