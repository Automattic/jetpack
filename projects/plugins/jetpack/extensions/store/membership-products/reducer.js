import { API_STATE_LOADING } from './constants';

export const DEFAULT_STATE = {
	products: [],
	apiState: API_STATE_LOADING,
	connectUrl: null,
	siteSlug: '',
	connectedAccountDefaultCurrency: '',
	subscriberCounts: {
		totalSubscribers: null,
		socialFollowers: null,
		emailSubscribers: null,
		paidSubscribers: null,
	},
	newsletterCategories: {
		enabled: false,
		categories: [],
	},
	postEmailSentState: {},
	alreadySentPostModifiedInSession: {},
	publishedWithEmailEnabledInSession: {},
};

export default function reducer( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case 'SET_PRODUCTS':
			return { ...state, products: action.products };
		case 'SET_CONNECT_URL':
			return { ...state, connectUrl: action.connectUrl };
		case 'SET_API_STATE':
			return { ...state, apiState: action.apiState };
		case 'SET_SITE_SLUG':
			return { ...state, siteSlug: action.siteSlug };
		case 'SET_CONNECTED_ACCOUNT_DEFAULT_CURRENCY':
			return {
				...state,
				connectedAccountDefaultCurrency: action.connectedAccountDefaultCurrency,
			};
		case 'SET_SUBSCRIBER_COUNTS':
			return {
				...state,
				subscriberCounts: action.subscriberCounts,
			};
		case 'SET_TOTAL_EMAILS_SENT_COUNT':
			return {
				...state,
				totalEmailsSentCount: action.totalEmailsSentCount,
			};
		case 'SET_NEWSLETTER_CATEGORIES':
			return {
				...state,
				newsletterCategories: action.newsletterCategories,
			};
		case 'SET_POST_EMAIL_SENT_STATE':
			return {
				...state,
				postEmailSentState: {
					...state.postEmailSentState,
					[ action.postId ]: {
						email_sent_at: action.payload.email_sent_at ?? null,
						stats_on_send: action.payload.stats_on_send ?? null,
					},
				},
			};
		case 'SET_ALREADY_SENT_POST_MODIFIED_IN_SESSION':
			return {
				...state,
				alreadySentPostModifiedInSession: {
					...state.alreadySentPostModifiedInSession,
					[ action.postId ]: true,
				},
			};
		case 'SET_PUBLISHED_WITH_EMAIL_ENABLED_IN_SESSION':
			return {
				...state,
				publishedWithEmailEnabledInSession: {
					...state.publishedWithEmailEnabledInSession,
					[ action.postId ]: true,
				},
			};
	}
	return state;
}
