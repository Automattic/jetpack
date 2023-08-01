import { API_STATE_LOADING } from './constants';

export const DEFAULT_STATE = {
	products: [],
	apiState: API_STATE_LOADING,
	connectUrl: null,
	siteSlug: '',
	connectedAccountDefaultCurrency: '',
	counts: {
		socialFollowers: null,
		emailSubscribers: null,
		paidSubscribers: null,
	},
	showMisconfigurationWarning: false,
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
		case 'SET_SOCIAL_FOLLOWER_COUNT':
			return {
				...state,
				counts: {
					...state.counts,
					socialFollowers: action.socialFollowers,
				},
			};
		case 'SET_EMAIL_SUBSCRIBER_COUNT':
			return {
				...state,
				counts: {
					...state.counts,
					emailSubscribers: action.emailSubscribers,
				},
			};
		case 'SET_PAID_SUBSCRIBER_COUNT':
			return {
				...state,
				counts: {
					...state.counts,
					paidSubscribers: action.paidSubscribers,
				},
			};
		case 'SET_SHOW_MISCONFIGURATION_WARNING':
			return { ...state, showMisconfigurationWarning: action.showMisconfigurationWarning };
	}
	return state;
}
