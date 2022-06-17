import { API_STATE_LOADING } from './constants';

export const DEFAULT_STATE = {
	products: [],
	apiState: API_STATE_LOADING,
	connectUrl: null,
	shouldUpgrade: false,
	siteSlug: '',
	upgradeUrl: null,
};

export default function reducer( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case 'SET_PRODUCTS':
			return { ...state, products: action.products };
		case 'SET_CONNECT_URL':
			return { ...state, connectUrl: action.connectUrl };
		case 'SET_API_STATE':
			return { ...state, apiState: action.apiState };
		case 'SET_SHOULD_UPGRADE':
			return { ...state, shouldUpgrade: action.shouldUpgrade };
		case 'SET_SITE_SLUG':
			return { ...state, siteSlug: action.siteSlug };
		case 'SET_UPGRADE_URL':
			return { ...state, upgradeUrl: action.upgradeUrl };
	}
	return state;
}
