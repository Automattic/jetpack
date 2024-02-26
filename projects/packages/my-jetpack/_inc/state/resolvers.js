/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import apiFetch from '@wordpress/api-fetch';
/**
 * Internal dependencies
 */
import { PRODUCT_STATUSES } from '../components/product-card';
import {
	REST_API_SITE_PRODUCTS_ENDPOINT,
	REST_API_REWINDABLE_BACKUP_EVENTS_ENDPOINT,
	REST_API_CHAT_AVAILABILITY_ENDPOINT,
	REST_API_CHAT_AUTHENTICATION_ENDPOINT,
	PRODUCTS_THAT_NEEDS_INITIAL_FETCH,
	getStatsHighlightsEndpoint,
	REST_API_COUNT_BACKUP_ITEMS_ENDPOINT,
} from './constants';
import resolveProductStatsRequest from './stats-resolvers';

const myJetpackResolvers = {
	getProduct: {
		isFulfilled: ( state, productId ) => {
			const items = state?.products?.items || {};
			return (
				items.hasOwnProperty( productId ) &&
				! PRODUCTS_THAT_NEEDS_INITIAL_FETCH.includes( productId )
			);
		},
		fulfill:
			productId =>
			async ( { dispatch } ) => {
				try {
					dispatch.setIsFetchingProduct( productId, true );
					const response = await apiFetch( {
						path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
					} );
					dispatch.setProduct( response );
					dispatch.setIsFetchingProduct( productId, false );
					return Promise.resolve();
				} catch ( error ) {
					dispatch.setIsFetchingProduct( productId, false );

					// Pick error from the response body.
					if ( error?.code && error?.message ) {
						dispatch.setRequestProductError( productId, error );
						return Promise.reject( error );
					}
					throw new Error( error );
				}
			},
	},

	getChatAvailability:
		() =>
		async ( { dispatch } ) => {
			dispatch.setChatAvailabilityIsFetching( true );

			try {
				dispatch.setChatAvailability(
					await apiFetch( { path: REST_API_CHAT_AVAILABILITY_ENDPOINT } )
				);
				dispatch.setChatAvailabilityIsFetching( false );
			} catch ( error ) {
				dispatch.setChatAvailabilityIsFetching( false );
			}
		},

	getChatAuthentication:
		() =>
		async ( { dispatch } ) => {
			dispatch.setChatAuthenticationIsFetching( true );

			try {
				dispatch.setChatAuthentication(
					await apiFetch( { path: REST_API_CHAT_AUTHENTICATION_ENDPOINT } )
				);
				dispatch.setChatAuthenticationIsFetching( false );
			} catch ( error ) {
				dispatch.setChatAuthenticationIsFetching( false );
			}
		},

	getAvailableLicenses:
		() =>
		async ( { dispatch } ) => {
			dispatch.setAvailableLicensesIsFetching( true );

			try {
				const { apiRoot, apiNonce } = window?.myJetpackRest || {};
				restApi.setApiRoot( apiRoot );
				restApi.setApiNonce( apiNonce );
				const result = await restApi.getUserLicenses();

				if ( result && result.items ) {
					dispatch.setAvailableLicenses(
						result.items.filter(
							( { attached_at, revoked_at } ) => attached_at === null && revoked_at === null
						)
					);
				} else {
					dispatch.setAvailableLicenses( [] );
				}
			} catch ( error ) {
				dispatch.setAvailableLicenses( [] );
			} finally {
				dispatch.setAvailableLicensesIsFetching( false );
			}
		},

	getBackupRewindableEvents: () => {
		return async ( { dispatch } ) => {
			dispatch.setBackupRewindableEventsIsFetching( true );

			try {
				dispatch.setBackupRewindableEvents(
					await apiFetch( { path: REST_API_REWINDABLE_BACKUP_EVENTS_ENDPOINT } )
				);
				dispatch.setBackupRewindableEventsIsFetching( false );
			} catch ( error ) {
				dispatch.setBackupRewindableEventsIsFetching( false );
			}
		};
	},

	getCountBackupItems: () => {
		return async ( { dispatch } ) => {
			dispatch.setCountBackupItemsIsFetching( true );

			try {
				dispatch.setCountBackupItems(
					await apiFetch( { path: REST_API_COUNT_BACKUP_ITEMS_ENDPOINT } )
				);
				dispatch.setCountBackupItemsIsFetching( false );
			} catch ( error ) {
				dispatch.setCountBackupItemsIsFetching( false );
			}
		};
	},

	getStatsCounts: () => async props => {
		const { dispatch, registry } = props;

		dispatch.setStatsCountsIsFetching( true );

		const blogId = registry.select( CONNECTION_STORE_ID ).getBlogId();

		try {
			dispatch.setStatsCounts( await apiFetch( { path: getStatsHighlightsEndpoint( blogId ) } ) );
			dispatch.setStatsCountsIsFetching( false );
		} catch ( error ) {
			dispatch.setStatsCountsIsFetching( false );
		}
	},
};

const getProductStats = {
	isFulfilled: ( state, productId ) => {
		return state.stats?.items?.hasOwnProperty( productId ) || false;
	},
	fulfill:
		productId =>
		async ( { dispatch, select } ) => {
			const { status } = select.getProduct( productId );

			// If the product is not active, we don't need to fetch the stats.
			if ( status !== PRODUCT_STATUSES.ACTIVE ) {
				// Set it to null so the requester knows the stats are not available
				dispatch.setProductStats( productId, null );
				return Promise.resolve();
			}

			try {
				dispatch.setIsFetchingProductStats( productId, true );

				/**
				 * Delegate the resolution to a product-specific resolver.
				 */
				const response = await resolveProductStatsRequest( productId );

				dispatch.setProductStats( productId, response );
				dispatch.setIsFetchingProductStats( productId, false );

				return Promise.resolve();
			} catch ( error ) {
				// Set it to null so the requester knows the stats are not available
				dispatch.setProductStats( productId, null );
				dispatch.setIsFetchingProductStats( productId, false );

				// Pick error from the response body.
				if ( error?.code && error?.message ) {
					return Promise.reject( error );
				}
				throw new Error( error );
			}
		},
};

export default {
	...myJetpackResolvers,
	getProductStats,
};
