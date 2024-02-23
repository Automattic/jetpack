import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { REST_API_SITE_DISMISS_BANNER, REST_API_SITE_PRODUCTS_ENDPOINT } from './constants';

/*
 * Action constants
 */
const SET_AVAILABLE_LICENSES_IS_FETCHING = 'SET_AVAILABLE_LICENSES_IS_FETCHING';
const FETCH_AVAILABLE_LICENSES = 'FETCH_AVAILABLE_LICENSES';
const SET_AVAILABLE_LICENSES = 'SET_AVAILABLE_LICENSES';
const SET_IS_FETCHING_PRODUCT = 'SET_IS_FETCHING_PRODUCT';
const SET_PRODUCT = 'SET_PRODUCT';
const SET_PRODUCT_REQUEST_ERROR = 'SET_PRODUCT_REQUEST_ERROR';
const ACTIVATE_PRODUCT = 'ACTIVATE_PRODUCT';
const SET_PRODUCT_STATUS = 'SET_PRODUCT_STATUS';
const SET_CHAT_AVAILABILITY_IS_FETCHING = 'SET_CHAT_AVAILABILITY_IS_FETCHING';
const SET_CHAT_AVAILABILITY = 'SET_CHAT_AVAILABILITY';
const SET_CHAT_AUTHENTICATION_IS_FETCHING = 'SET_CHAT_AUTHENTICATION_IS_FETCHING';
const SET_CHAT_AUTHENTICATION = 'SET_CHAT_AUTHENTICATION';
const SET_STATS_COUNTS_IS_FETCHING = 'SET_STATS_COUNTS_IS_FETCHING';
const SET_STATS_COUNTS = 'SET_STATS_COUNTS';
const SET_DISMISSED_WELCOME_BANNER_IS_FETCHING = 'SET_DISMISSED_WELCOME_BANNER_IS_FETCHING';
const SET_DISMISSED_WELCOME_BANNER = 'SET_DISMISSED_WELCOME_BANNER';

const SET_BACKUP_REWINDABLE_EVENTS_IS_FETCHING = 'SET_BACKUP_REWINDABLE_EVENTS_IS_FETCHING';
const SET_BACKUP_REWINDABLE_EVENTS = 'SET_BACKUP_REWINDABLE_EVENTS';

const SET_COUNT_BACKUP_ITEMS = 'SET_COUNT_BACKUP_ITEMS';
const SET_COUNT_BACKUP_ITEMS_IS_FETCHING = 'SET_COUNT_BACKUP_ITEMS_IS_FETCHING';

const SET_GLOBAL_NOTICE = 'SET_GLOBAL_NOTICE';
const CLEAN_GLOBAL_NOTICE = 'CLEAN_GLOBAL_NOTICE';

const SET_PRODUCT_STATS = 'SET_PRODUCT_STATS';
const SET_IS_FETCHING_PRODUCT_STATS = 'SET_IS_FETCHING_PRODUCT_STATS';

const setChatAvailabilityIsFetching = isFetching => {
	return { type: SET_CHAT_AVAILABILITY_IS_FETCHING, isFetching };
};

const setChatAuthenticationIsFetching = isFetching => {
	return { type: SET_CHAT_AUTHENTICATION_IS_FETCHING, isFetching };
};

const setBackupRewindableEventsIsFetching = isFetching => {
	return { type: SET_BACKUP_REWINDABLE_EVENTS_IS_FETCHING, isFetching };
};

const setCountBackupItemsIsFetching = isFetching => {
	return { type: SET_COUNT_BACKUP_ITEMS_IS_FETCHING, isFetching };
};

const setStatsCountsIsFetching = isFetching => {
	return { type: SET_STATS_COUNTS_IS_FETCHING, isFetching };
};

const setChatAvailability = chatAvailability => {
	return { type: SET_CHAT_AVAILABILITY, chatAvailability };
};

const setChatAuthentication = chatAuthentication => {
	return { type: SET_CHAT_AUTHENTICATION, chatAuthentication };
};

const setAvailableLicensesIsFetching = isFetching => {
	return { type: SET_AVAILABLE_LICENSES_IS_FETCHING, isFetching };
};

const fetchAvailableLicenses = () => {
	return { type: FETCH_AVAILABLE_LICENSES };
};

const setAvailableLicenses = availableLicenses => {
	return { type: SET_AVAILABLE_LICENSES, availableLicenses };
};

const setProduct = product => ( { type: SET_PRODUCT, product } );

const setBackupRewindableEvents = rewindableEvents => ( {
	type: SET_BACKUP_REWINDABLE_EVENTS,
	rewindableEvents,
} );

const setCountBackupItems = backupItems => ( {
	type: SET_COUNT_BACKUP_ITEMS,
	backupItems,
} );

const setStatsCounts = statsCounts => ( { type: SET_STATS_COUNTS, statsCounts } );

const setRequestProductError = ( productId, error ) => ( {
	type: SET_PRODUCT_REQUEST_ERROR,
	productId,
	error,
} );

const setProductStatus = ( productId, status ) => {
	return { type: SET_PRODUCT_STATUS, productId, status };
};

const setDismissedWelcomeBannerIsFetching = isFetching => {
	return { type: SET_DISMISSED_WELCOME_BANNER_IS_FETCHING, isFetching };
};

const setDismissedWelcomeBanner = hasBeenDismissed => {
	return { type: SET_DISMISSED_WELCOME_BANNER, hasBeenDismissed };
};

const setGlobalNotice = ( message, options ) => ( {
	type: 'SET_GLOBAL_NOTICE',
	message,
	options,
} );

const cleanGlobalNotice = () => ( { type: 'CLEAN_GLOBAL_NOTICE' } );

/**
 * Action that set the `isFetching` state of the product,
 * when the client hits the server.
 *
 * @param {string} productId   - My Jetpack product ID.
 * @param {boolean} isFetching - True if the product is being fetched. Otherwise, False.
 * @returns {object}           - Redux action.
 */
function setIsFetchingProduct( productId, isFetching ) {
	return {
		type: SET_IS_FETCHING_PRODUCT,
		productId,
		isFetching,
	};
}

/**
 * Side effect action which will sync
 * the `status` state of the product with the server.
 *
 * @param {string}   productId      - My Jetpack product ID.
 * @param {object}   data           - POST Action data. eg: { activate: true }
 * @param {object}   store          - Redux store.
 * @param {object}   store.select   - Redux store select.
 * @param {Function} store.dispatch - Redux store dispatch.
 * @param {object}   store.registry - Redux registry.
 * @returns {Promise}               - Promise which resolves when the product status is updated.
 */
function requestProductStatus( productId, data, { select, dispatch, registry } ) {
	return new Promise( ( resolve, reject ) => {
		// Check valid product.
		const isValid = select.isValidProduct( productId );

		if ( ! isValid ) {
			const message = __( 'Invalid product name', 'jetpack-my-jetpack' );
			const error = new Error( message );

			dispatch( setRequestProductError( productId, error ) );
			dispatch( setGlobalNotice( message, { status: 'error', isDismissible: true } ) );
			reject( error );
			return;
		}

		const method = data.activate ? 'POST' : 'DELETE';
		dispatch( setIsFetchingProduct( productId, true ) );

		// Activate product.
		return apiFetch( {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
			method,
		} )
			.then( freshProduct => {
				dispatch( setIsFetchingProduct( productId, false ) );
				dispatch( setProduct( freshProduct ) );
				registry.dispatch( CONNECTION_STORE_ID ).refreshConnectedPlugins();
				resolve( freshProduct?.status );
			} )
			.catch( error => {
				const { name } = select.getProduct( productId );
				const message = sprintf(
					// translators: %$1s: Jetpack Product name
					__( 'Failed to activate %1$s. Please try again', 'jetpack-my-jetpack' ),
					name
				);

				dispatch( setIsFetchingProduct( productId, false ) );
				dispatch( setRequestProductError( productId, error ) );
				dispatch( setGlobalNotice( message, { status: 'error', isDismissible: true } ) );
				reject( error );
			} );
	} );
}

/**
 * Side effect action which will sync
 * the `activate` state of the product with the server.
 *
 * @param {string} productId - My Jetpack product ID.
 * @returns {Promise}        - Promise which resolves when the product status is activated.
 */
const activateProduct = productId => async store => {
	return await requestProductStatus( productId, { activate: true }, store );
};

/**
 * Side effect action that will trigger
 * the standalone plugin activation state on the server.
 *
 * @param {string} productId - My Jetpack product ID.
 * @returns {Promise}        - Promise which resolves when the product plugin is deactivated.
 */
const deactivateStandalonePluginForProduct = productId => async store => {
	return await requestProductStatus( productId, { activate: false }, store );
};

/**
 * Side effect action that will trigger
 * the standalone plugin installation on the server.
 *
 * @param {string} productId - My Jetpack product ID.
 * @returns {Promise}        - Promise which resolves when the product plugin is installed.
 */
const installStandalonePluginForProduct = productId => async store => {
	const { select, dispatch, registry } = store;
	return await new Promise( ( resolve, reject ) => {
		// Check valid product.
		const isValid = select.isValidProduct( productId );

		if ( ! isValid ) {
			const message = __( 'Invalid product name', 'jetpack-my-jetpack' );
			const error = new Error( message );

			dispatch( setRequestProductError( productId, error ) );
			dispatch( setGlobalNotice( message, { status: 'error', isDismissible: true } ) );
			reject( error );
			return;
		}

		/** Processing... */
		dispatch( setIsFetchingProduct( productId, true ) );

		// Install product standalone plugin.
		return apiFetch( {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }/install-standalone`,
			method: 'POST',
		} )
			.then( freshProduct => {
				dispatch( setIsFetchingProduct( productId, false ) );
				dispatch( setProduct( freshProduct ) );
				registry.dispatch( CONNECTION_STORE_ID ).refreshConnectedPlugins();
				resolve( freshProduct?.standalone_plugin_info );
			} )
			.catch( error => {
				const { name } = select.getProduct( productId );
				const message = sprintf(
					// translators: %$1s: Jetpack Product name; %$2s: Original error message
					__(
						'Failed to install standalone plugin for %1$s: %2$s. Please try again',
						'jetpack-my-jetpack'
					),
					name,
					error.message
				);

				dispatch( setIsFetchingProduct( productId, false ) );
				dispatch( setRequestProductError( productId, error ) );
				dispatch( setGlobalNotice( message, { status: 'error', isDismissible: true } ) );
				reject( error );
			} );
	} );
};

/**
 * Request to set the welcome banner as dismissed
 *
 * @returns {Promise} - Promise which resolves when the banner is dismissed.
 */
const dismissWelcomeBanner = () => async store => {
	const { dispatch } = store;

	dispatch( setDismissedWelcomeBannerIsFetching( true ) );

	return apiFetch( {
		path: REST_API_SITE_DISMISS_BANNER,
		method: 'POST',
	} )
		.then( () => {
			dispatch( setDismissedWelcomeBanner( true ) );
		} )
		.finally( () => {
			dispatch( setDismissedWelcomeBannerIsFetching( false ) );
		} );
};

const setProductStats = ( productId, stats ) => {
	return { type: SET_PRODUCT_STATS, productId, stats };
};

const setIsFetchingProductStats = ( productId, isFetching ) => {
	return { type: SET_IS_FETCHING_PRODUCT_STATS, productId, isFetching };
};

const productActions = {
	setProduct,
	activateProduct,
	deactivateStandalonePluginForProduct,
	installStandalonePluginForProduct,
	setIsFetchingProduct,
	setRequestProductError,
	setProductStatus,
};

const noticeActions = {
	setGlobalNotice,
	cleanGlobalNotice,
};

const actions = {
	setChatAvailabilityIsFetching,
	setChatAuthenticationIsFetching,
	setChatAvailability,
	setChatAuthentication,
	setAvailableLicensesIsFetching,
	fetchAvailableLicenses,
	setAvailableLicenses,
	setProductStats,
	setIsFetchingProductStats,
	setBackupRewindableEvents,
	setBackupRewindableEventsIsFetching,
	setCountBackupItems,
	setCountBackupItemsIsFetching,
	setStatsCounts,
	setStatsCountsIsFetching,
	dismissWelcomeBanner,
	...noticeActions,
	...productActions,
};

export {
	SET_AVAILABLE_LICENSES_IS_FETCHING,
	FETCH_AVAILABLE_LICENSES,
	SET_AVAILABLE_LICENSES,
	SET_PRODUCT,
	SET_PRODUCT_REQUEST_ERROR,
	ACTIVATE_PRODUCT,
	SET_IS_FETCHING_PRODUCT,
	SET_PRODUCT_STATUS,
	SET_GLOBAL_NOTICE,
	CLEAN_GLOBAL_NOTICE,
	SET_PRODUCT_STATS,
	SET_IS_FETCHING_PRODUCT_STATS,
	SET_CHAT_AVAILABILITY,
	SET_CHAT_AVAILABILITY_IS_FETCHING,
	SET_CHAT_AUTHENTICATION,
	SET_CHAT_AUTHENTICATION_IS_FETCHING,
	SET_BACKUP_REWINDABLE_EVENTS_IS_FETCHING,
	SET_BACKUP_REWINDABLE_EVENTS,
	SET_COUNT_BACKUP_ITEMS_IS_FETCHING,
	SET_COUNT_BACKUP_ITEMS,
	SET_STATS_COUNTS_IS_FETCHING,
	SET_STATS_COUNTS,
	SET_DISMISSED_WELCOME_BANNER_IS_FETCHING,
	SET_DISMISSED_WELCOME_BANNER,
	actions as default,
};
