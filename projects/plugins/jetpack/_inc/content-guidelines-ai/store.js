import apiFetch from '@wordpress/api-fetch';
import { createReduxStore, register } from '@wordpress/data';

// Per-user dismissed flag, persisted server-side so it follows the user across
// devices/browsers. The initial value is preloaded into the page by PHP (see
// _inc/content-guidelines-ai.php); dismissal is written via this REST route.
const DISMISS_PATH = '/wpcom/v2/jetpack-ai/guidelines-banner-dismissed';

const DEFAULT_STATE = {
	loading: false,
	loadingSections: {},
	suggestions: {},
	bannerDismissed: !! window.jetpackContentGuidelinesAi?.bannerDismissed,
	// Session-only: set when a Generate click happens without an AI plan, so
	// the upgrade notice resurfaces even after the persisted dismissal — the
	// click is a fresh intent signal that bypasses the dismissed flag.
	upgradeNoticeForced: false,
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
	showUpgradeNotice() {
		return { type: 'SHOW_UPGRADE_NOTICE' };
	},
	hideUpgradeNotice() {
		return { type: 'HIDE_UPGRADE_NOTICE' };
	},
	dismissBanner() {
		return ( { select, dispatch } ) => {
			// One-way flag — skip the write if already dismissed.
			if ( select.isBannerDismissed() ) {
				return;
			}
			// Optimistic: update state now, persist per-user in the background.
			// A failed write is ignored — re-syncs from the preloaded value on
			// the next page load.
			dispatch( { type: 'DISMISS_BANNER' } );
			apiFetch( {
				method: 'PUT',
				path: DISMISS_PATH,
			} ).catch( () => {} );
		};
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
		case 'DISMISS_BANNER':
			return { ...state, bannerDismissed: true, upgradeNoticeForced: false };
		case 'SHOW_UPGRADE_NOTICE':
			return { ...state, upgradeNoticeForced: true };
		case 'HIDE_UPGRADE_NOTICE':
			return { ...state, upgradeNoticeForced: false };
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
	isBannerDismissed( state ) {
		return state.bannerDismissed;
	},
	isUpgradeNoticeForced( state ) {
		return state.upgradeNoticeForced;
	},
};

export const AI_STORE_NAME = 'jetpack/content-guidelines-ai';

const aiStore = createReduxStore( AI_STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( aiStore );
