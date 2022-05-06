/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { store as editorStore } from '@wordpress/editor';
import { addQueryArgs, getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	saveProduct,
	setApiState,
	setConnectUrl,
	setProducts,
	setShouldUpgrade,
	setSiteSlug,
	setUpgradeUrl,
} from './actions';
import { onError } from './utils';
import { API_STATE_CONNECTED, API_STATE_NOTCONNECTED } from './constants';
import getConnectUrl from '../../shared/get-connect-url';
import { PRODUCT_TYPE_PAYMENT_PLAN } from '../../shared/components/product-management-controls/constants';
import { getMessageByProductType } from '../../shared/components/product-management-controls/utils';
import executionLock from '../../shared/execution-lock';

const EXECUTION_KEY = 'membership-products-resolver-getProducts';

export const getProducts = (
	productType = PRODUCT_TYPE_PAYMENT_PLAN,
	selectedProductId = 0,
	setSelectedProductId = () => {}
) => async ( { dispatch, registry } ) => {
	await executionLock.blockExecution( EXECUTION_KEY );
	const lock = executionLock.acquire( EXECUTION_KEY );

	const origin = getQueryArg( window.location.href, 'origin' );
	const path = addQueryArgs( '/wpcom/v2/memberships/status', {
		source: origin === 'https://wordpress.com' ? 'gutenberg-wpcom' : 'gutenberg',
		type: 'all',
		is_editable: true,
	} );

	try {
		const response = await apiFetch( { path, method: 'GET' } );
		if ( ! response && typeof response !== 'object' ) {
			return;
		}

		/**
		 * WP_Error returns a list of errors with custom names:
		 * `errors: { foo: [ 'message' ], bar: [ 'message' ] }`
		 * Since we don't know their names, to get the message, we transform the object
		 * into an array, and just pick the first message of the first error.
		 *
		 * @see https://developer.wordpress.org/reference/classes/wp_error/
		 */
		const wpError = response?.errors && Object.values( response.errors )?.[ 0 ]?.[ 0 ];
		if ( wpError ) {
			dispatch( setApiState( API_STATE_NOTCONNECTED ) );
			onError( wpError, registry );
			return;
		}

		const postId = registry.select( editorStore ).getCurrentPostId();

		dispatch( setConnectUrl( getConnectUrl( postId, response.connect_url ) ) );
		dispatch( setShouldUpgrade( response.should_upgrade_to_access_memberships ) );
		dispatch( setSiteSlug( response.site_slug ) );
		dispatch( setUpgradeUrl( response.upgrade_url ) );

		if (
			! response?.products?.length &&
			! response.should_upgrade_to_access_memberships &&
			response.connected_account_id &&
			! selectedProductId
		) {
			// Is ready to use and has no product set up yet. Let's create one!
			await dispatch(
				saveProduct(
					{
						title: getMessageByProductType( 'default new product title', productType ),
						currency: 'USD',
						price: 5,
						interval: '1 month',
					},
					productType,
					setSelectedProductId
				)
			);
			dispatch( setApiState( API_STATE_CONNECTED ) );
			executionLock.release( lock );
			return;
		}

		if ( response?.products?.length > 0 ) {
			dispatch( setProducts( response.products ) );
			if ( ! selectedProductId ) {
				setSelectedProductId( response.products[ 0 ].id );
			}
		}

		dispatch(
			setApiState( response.connected_account_id ? API_STATE_CONNECTED : API_STATE_NOTCONNECTED )
		);
	} catch ( error ) {
		dispatch( setConnectUrl( null ) );
		dispatch( setApiState( API_STATE_NOTCONNECTED ) );
		onError( error.message, registry );
	}
	executionLock.release( lock );
};
