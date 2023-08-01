import apiFetch from '@wordpress/api-fetch';
import { store as editorStore } from '@wordpress/editor';
import { addQueryArgs, getQueryArg } from '@wordpress/url';
import { accessOptions } from '../../blocks/subscriptions/constants';
import { PRODUCT_TYPE_PAYMENT_PLAN } from '../../shared/components/product-management-controls/constants';
import { getMessageByProductType } from '../../shared/components/product-management-controls/utils';
import executionLock from '../../shared/execution-lock';
import getConnectUrl from '../../shared/get-connect-url';
import {
	saveProduct,
	setApiState,
	setConnectUrl,
	setProducts,
	setSiteSlug,
	setConnectedAccountDefaultCurrency,
	setSocialFollowerCount,
	setEmailSubscriberCount,
	setPaidSubscriberCount,
	setShowMisconfigurationWarning,
} from './actions';
import { API_STATE_CONNECTED, API_STATE_NOTCONNECTED } from './constants';
import { onError } from './utils';
import { store as membershipProductsStore } from './';

const EXECUTION_KEY = 'membership-products-resolver-getProducts';
const SUBSCRIBER_COUNT_EXECUTION_KEY = 'membership-products-resolver-getSubscriberCounts';
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
	dispatch( setSiteSlug( response.site_slug ) );
	dispatch( setProducts( response.products ) );
	dispatch( setConnectedAccountDefaultCurrency( response.connected_account_default_currency ) );
	dispatch(
		setApiState( response.connected_account_id ? API_STATE_CONNECTED : API_STATE_NOTCONNECTED )
	);
};

const fetchSubscriberCounts = async () => {
	const response = await apiFetch( {
		path: '/wpcom/v2/subscribers/counts',
	} );

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

const mapSubscriberCountsAPIResponseToMembershipProductsStoreData = (
	response,
	registry,
	dispatch
) => {
	dispatch( setSocialFollowerCount( response.counts.social_followers ) );
	dispatch( setEmailSubscriberCount( response.counts.email_subscribers ) );
	dispatch( setPaidSubscriberCount( response.counts.paid_subscribers ) );
};

const createDefaultProduct = async (
	productType,
	setSelectedProductId,
	dispatch,
	shouldDisplayProductCreationNotice
) => {
	await dispatch(
		saveProduct(
			{
				title: getMessageByProductType( 'default new product title', productType ),
				currency: 'USD',
				price: 5,
				interval: '1 month',
			},
			productType,
			setSelectedProductId,
			() => {},
			shouldDisplayProductCreationNotice
		)
	);
};

const shouldCreateDefaultProduct = response =>
	! response.products.length && response.connected_account_id;

const setDefaultProductIfNeeded = ( selectedProductId, setSelectedProductId, select ) => {
	if ( selectedProductId ) {
		return;
	}
	const defaultProductId = select.getProductsNoResolver()[ 0 ]?.id;
	if ( defaultProductId ) {
		setSelectedProductId( defaultProductId );
	}
};

export const getNewsletterProducts = (
	productType = PRODUCT_TYPE_PAYMENT_PLAN,
	selectedProductId = 0,
	setSelectedProductId = () => {}
) =>
	// Returns the products, but silences the snack bar if a default product is created
	getProducts( productType, selectedProductId, setSelectedProductId, false );

export const getProducts =
	(
		productType = PRODUCT_TYPE_PAYMENT_PLAN,
		selectedProductId = 0,
		setSelectedProductId = () => {},
		shouldDisplayProductCreationNotice = true
	) =>
	async ( { dispatch, registry, select } ) => {
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
				await createDefaultProduct(
					productType,
					setSelectedProductId,
					dispatch,
					shouldDisplayProductCreationNotice
				);
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

export const getSubscriberCounts =
	() =>
	async ( { dispatch, registry } ) => {
		await executionLock.blockExecution( SUBSCRIBER_COUNT_EXECUTION_KEY );

		const lock = executionLock.acquire( SUBSCRIBER_COUNT_EXECUTION_KEY );
		try {
			const response = await fetchSubscriberCounts();
			mapSubscriberCountsAPIResponseToMembershipProductsStoreData( response, registry, dispatch );
		} catch ( error ) {
			dispatch( setApiState( API_STATE_NOTCONNECTED ) );
			onError( error.message, registry );
		}
		executionLock.release( lock );
	};

export const getShowMisconfigurationWarning =
	() =>
	async ( { dispatch, registry } ) => {
		// Can be “private”, “password”, or “public”.
		const {
			accessLevel,
			postVisibility,
		} = () => {
			return {
				accessLevel: registry.select( membershipProductsStore ).getAccessLevel(),
				postVisibility: registry.select( editorStore ).getEditedPostVisibility(),
			};
		};

		const showMisconfigurationWarning =
			postVisibility !== 'public' && accessLevel !== accessOptions.everybody.key;

		dispatch( setShowMisconfigurationWarning( showMisconfigurationWarning ) );
	};
