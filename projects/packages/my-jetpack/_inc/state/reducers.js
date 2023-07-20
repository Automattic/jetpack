import { combineReducers } from '@wordpress/data';
import {
	SET_PURCHASES,
	SET_PURCHASES_IS_FETCHING,
	SET_CHAT_AVAILABILITY,
	SET_CHAT_AUTHENTICATION,
	SET_CHAT_AVAILABILITY_IS_FETCHING,
	SET_CHAT_AUTHENTICATION_IS_FETCHING,
	SET_AVAILABLE_LICENSES,
	SET_AVAILABLE_LICENSES_IS_FETCHING,
	SET_PRODUCT,
	SET_PRODUCT_STATUS,
	SET_IS_FETCHING_PRODUCT,
	SET_PRODUCT_REQUEST_ERROR,
	SET_GLOBAL_NOTICE,
	CLEAN_GLOBAL_NOTICE,
	SET_PRODUCT_STATS,
	SET_IS_FETCHING_PRODUCT_STATS,
} from './actions';

const products = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_IS_FETCHING_PRODUCT: {
			const { productId, isFetching } = action;
			return {
				...state,
				isFetching: {
					...state.isFetching,
					[ productId ]: isFetching,
				},
				errors: {
					...state.errors,
					[ productId ]: isFetching ? undefined : state.errors[ productId ],
				},
			};
		}

		case SET_PRODUCT_STATUS: {
			const { productId, status } = action;
			return {
				...state,
				items: {
					...state.items,
					[ productId ]: {
						...state.items[ productId ],
						status,
					},
				},
			};
		}

		case SET_PRODUCT: {
			const { product } = action;
			const { slug: productId } = product;
			return {
				...state,
				items: {
					...state.items,
					[ productId ]: product,
				},
			};
		}

		case SET_PRODUCT_REQUEST_ERROR: {
			const { productId, error } = action;
			return {
				...state,
				errors: {
					...state.errors,
					[ productId ]: error,
				},
			};
		}

		default:
			return state;
	}
};

const purchases = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_PURCHASES_IS_FETCHING:
			return {
				...state,
				isFetching: action.isFetching,
			};

		case SET_PURCHASES:
			return {
				...state,
				items: action?.purchases || [],
			};

		default:
			return state;
	}
};

const chatAvailability = ( state = { isFetching: false, isAvailable: false }, action ) => {
	switch ( action.type ) {
		case SET_CHAT_AVAILABILITY_IS_FETCHING:
			return {
				...state,
				isFetching: action.isFetching,
			};

		case SET_CHAT_AVAILABILITY:
			return {
				...state,
				isAvailable: action?.chatAvailability?.is_available,
			};

		default:
			return state;
	}
};

const chatAuthentication = ( state = { isFetching: false, jwt: false }, action ) => {
	switch ( action.type ) {
		case SET_CHAT_AUTHENTICATION_IS_FETCHING:
			return {
				...state,
				isFetching: action.isFetching,
			};

		case SET_CHAT_AUTHENTICATION:
			return {
				...state,
				jwt: action?.chatAuthentication?.user?.jwt,
			};

		default:
			return state;
	}
};

const availableLicenses = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_AVAILABLE_LICENSES_IS_FETCHING:
			return {
				...state,
				isFetching: action.isFetching,
			};

		case SET_AVAILABLE_LICENSES:
			return {
				...state,
				items: action?.availableLicenses || [],
			};

		default:
			return state;
	}
};

const notices = ( state = { global: {} }, action ) => {
	switch ( action.type ) {
		case SET_GLOBAL_NOTICE: {
			const { message, options } = action;
			return {
				...state,
				global: {
					message,
					options,
				},
			};
		}

		case CLEAN_GLOBAL_NOTICE: {
			return {
				...state,
				global: {},
			};
		}

		default:
			return state;
	}
};

const plugins = ( state = {} ) => {
	return state;
};

const stats = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_IS_FETCHING_PRODUCT_STATS: {
			const { productId, isFetching } = action;
			return {
				...state,
				isFetching: {
					...state.isFetching,
					[ productId ]: isFetching,
				},
			};
		}

		case SET_PRODUCT_STATS: {
			const { productId, stats: productStats } = action;
			return {
				...state,
				items: {
					...state.items,
					[ productId ]: productStats,
				},
			};
		}

		default:
			return state;
	}
};

const reducers = combineReducers( {
	products,
	purchases,
	chatAvailability,
	chatAuthentication,
	availableLicenses,
	notices,
	plugins,
	stats,
} );

export default reducers;
