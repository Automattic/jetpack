import apiFetch from '@wordpress/api-fetch';
import { store as editorStore } from '@wordpress/editor';
import { addQueryArgs, getQueryArg } from '@wordpress/url';
import { PRODUCT_TYPE_PAYMENT_PLAN } from '../../shared/components/product-management-controls/constants';
import { getMessageByProductType } from '../../shared/components/product-management-controls/utils';
import executionLock from '../../shared/execution-lock';
import getConnectUrl from '../../shared/get-connect-url';
import {
	saveProduct,
	setApiState,
	setConnectUrl,
	setProducts,
	setShouldUpgrade,
	setSiteSlug,
	setUpgradeUrl,
} from './actions';
import { API_STATE_CONNECTED, API_STATE_NOTCONNECTED } from './constants';
import { onError } from './utils';

const EXECUTION_KEY = 'membership-products-resolver-getProducts';
let hydratedFromAPI = false;

const fetchMemberships = async () => {
	const origin = getQueryArg( window.location.href, 'origin' );
	const path = addQueryArgs( '/wpcom/v2/memberships/status', {
		source: origin === 'https://wordpress.com' ? 'gutenberg-wpcom' : 'gutenberg',
		type: 'all',
		is_editable: true,
	} );

	const response = await apiFetch( { path, method: 'GET' } );

	if ( ! response && typeof response !== 'object' ) {
		throw new Error( 'Unexpected API response' );
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
		throw new Error( wpError );
	}

	return response;
};

const mapAPIResponseToMembershipProductsStoreData = ( response, registry, dispatch ) => {
	const postId = registry.select( editorStore ).getCurrentPostId();

	dispatch( setConnectUrl( getConnectUrl( postId, response.connect_url ) ) );
	dispatch( setShouldUpgrade( response.should_upgrade_to_access_memberships ) );
	dispatch( setSiteSlug( response.site_slug ) );
	dispatch( setUpgradeUrl( response.upgrade_url ) );
	dispatch( setProducts( response.products ) );
	dispatch(
		setApiState( response.connected_account_id ? API_STATE_CONNECTED : API_STATE_NOTCONNECTED )
	);
};

const createDefaultProduct = async ( productType, setSelectedProductId, dispatch ) => {
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
};

const shouldCreateDefaultProduct = response =>
	! response.products.length &&
	! response.should_upgrade_to_access_memberships &&
	response.connected_account_id;

const setDefaultProductIfNeeded = ( selectedProductId, setSelectedProductId, select ) => {
	if ( selectedProductId ) {
		return;
	}
	const defaultProduct = select.getProductsNoResolver()[ 0 ];
	if ( defaultProduct?.id ) {
		setSelectedProductId( defaultProduct.id, defaultProduct );
	}
};

export const getProducts = (
	productType = PRODUCT_TYPE_PAYMENT_PLAN,
	selectedProductId = 0,
	setSelectedProductId = () => {}
) => async ( { dispatch, registry, select } ) => {
	await executionLock.blockExecution( EXECUTION_KEY );
	if ( hydratedFromAPI ) {
		setDefaultProductIfNeeded( selectedProductId, setSelectedProductId, select );
		return;
	}

	const lock = executionLock.acquire( EXECUTION_KEY );
	try {
		const response = await fetchMemberships();
		mapAPIResponseToMembershipProductsStoreData( response, registry, dispatch );

		if ( shouldCreateDefaultProduct( response ) ) {
			// Is ready to use and has no product set up yet. Let's create one!
			await createDefaultProduct( productType, setSelectedProductId, dispatch );
		}

		setDefaultProductIfNeeded( selectedProductId, setSelectedProductId, select );

		hydratedFromAPI = true;
	} catch ( error ) {
		dispatch( setConnectUrl( null ) );
		dispatch( setApiState( API_STATE_NOTCONNECTED ) );
		onError( error.message, registry );
	}
	executionLock.release( lock );
};
