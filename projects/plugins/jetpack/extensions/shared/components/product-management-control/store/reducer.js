/**
 * Internal dependencies
 */
import { API_STATE_LOADING } from '..constants/constants';

export const DEFAULT_STATE = {
	products: [],
	connectUrl: null,
	apiState: API_STATE_LOADING,
	shouldUpgrade: false,
	siteSlug: '',
};

export default function reducer( state = DEFAULT_STATE, action ) {
	switch ( action.type ) {
		case 'SET_PRODUCTS':
			return { ...state, products: action.products };
		case 'SET_CONNECT_URL':
			return { ...state, products: action.connectUrl };
		case 'SET_API_STATE':
			return { ...state, products: action.apiState };
		case 'SET_SHOULD_UPGRADE':
			return { ...state, products: action.shouldUpgrade };
		case 'SET_SITE_SLUG':
			return { ...state, products: action.siteSlug };
	}
	return state;
}
