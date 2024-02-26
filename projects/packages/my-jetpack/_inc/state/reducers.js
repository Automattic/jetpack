import { combineReducers } from '@wordpress/data';
import {
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
	SET_BACKUP_REWINDABLE_EVENTS_IS_FETCHING,
	SET_BACKUP_REWINDABLE_EVENTS,
	SET_COUNT_BACKUP_ITEMS_IS_FETCHING,
	SET_COUNT_BACKUP_ITEMS,
	SET_STATS_COUNTS_IS_FETCHING,
	SET_STATS_COUNTS,
	SET_DISMISSED_WELCOME_BANNER_IS_FETCHING,
	SET_DISMISSED_WELCOME_BANNER,
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

const backupRewindableEvents = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_BACKUP_REWINDABLE_EVENTS_IS_FETCHING:
			return {
				...state,
				isFetching: action.isFetching,
			};

		case SET_BACKUP_REWINDABLE_EVENTS:
			return {
				...state,
				items: action?.rewindableEvents || {},
			};

		default:
			return state;
	}
};

const countBackupItems = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_COUNT_BACKUP_ITEMS_IS_FETCHING:
			return {
				...state,
				isFetching: action.isFetching,
			};

		case SET_COUNT_BACKUP_ITEMS:
			return {
				...state,
				items: action?.backupItems || {},
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

const statsCounts = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_STATS_COUNTS_IS_FETCHING:
			return {
				...state,
				isFetching: action.isFetching,
			};

		case SET_STATS_COUNTS:
			return {
				...state,
				data: action?.statsCounts || {},
			};

		default:
			return state;
	}
};

const welcomeBanner = ( state = {}, action ) => {
	switch ( action.type ) {
		case SET_DISMISSED_WELCOME_BANNER_IS_FETCHING:
			return {
				...state,
				isFetching: action.isFetching,
			};

		case SET_DISMISSED_WELCOME_BANNER:
			return {
				...state,
				hasBeenDismissed: action.hasBeenDismissed,
			};

		default:
			return state;
	}
};

const reducers = combineReducers( {
	products,
	backupRewindableEvents,
	countBackupItems,
	chatAvailability,
	chatAuthentication,
	availableLicenses,
	notices,
	plugins,
	stats,
	statsCounts,
	welcomeBanner,
} );

export default reducers;
