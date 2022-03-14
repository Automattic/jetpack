/**
 * External dependencies
 */
import formatCurrency from '@automattic/format-currency';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { addQueryArgs, getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { API_STATE_CONNECTED, API_STATE_NOTCONNECTED } from './constants';
import { jetpackMembershipProductsStore } from './store';
import { isPriceValid, minimumTransactionAmountForCurrency } from '../../currencies';
import getConnectUrl from '../../get-connect-url';

export default function useProducts( selectedProductIdAttribute, setAttributes ) {
	const { postId, products } = useSelect( select => {
		const { getCurrentPostId } = select( editorStore );
		const { getProducts } = select( jetpackMembershipProductsStore );
		return {
			postId: getCurrentPostId(),
			products: getProducts(),
		};
	} );
	const { setProducts, setConnectUrl, setApiState, setShouldUpgrade, setSiteSlug } = useDispatch(
		jetpackMembershipProductsStore
	);

	const { createErrorNotice, createSuccessNotice } = useDispatch( noticesStore );
	const onError = message => createErrorNotice( message, { type: 'snackbar' } );
	const onSuccess = message => createSuccessNotice( message, { type: 'snackbar' } );

	const selectProduct = product => setAttributes( { [ selectedProductIdAttribute ]: product.id } );

	const saveProduct = ( product, callback = () => {} ) => {
		const { title, price, currency } = product;

		if ( ! title || 0 === title.length ) {
			onError( __( 'Plan requires a name', 'jetpack' ) );
			callback( false );
			return;
		}

		const parsedPrice = parseFloat( price );
		const minPrice = minimumTransactionAmountForCurrency( currency );
		if ( parsedPrice < minPrice ) {
			onError(
				sprintf(
					// translators: %s: Price
					__( 'Minimum allowed price is %s.', 'jetpack' ),
					formatCurrency( minPrice, currency )
				)
			);
			callback( false );
			return;
		}
		if ( ! isPriceValid( currency, parsedPrice ) ) {
			onError( __( 'Plan requires a valid price', 'jetpack' ) );
			callback( false );
			return;
		}

		apiFetch( {
			path: '/wpcom/v2/memberships/product',
			method: 'POST',
			data: product,
		} ).then(
			result => {
				const newProduct = {
					id: result.id,
					title: result.title,
					interval: result.interval,
					price: result.price,
					currency: result.currency,
				};
				setProducts( products.concat( [ newProduct ] ) );
				selectProduct( newProduct );
				onSuccess( __( 'Successfully created plan', 'jetpack' ) );
				callback( true );
			},
			() => {
				onError( __( 'There was an error when adding the plan.', 'jetpack' ) );
				callback( false );
			}
		);
	};

	const fetchProducts = selectedProductId => {
		const origin = getQueryArg( window.location.href, 'origin' );
		const path = addQueryArgs( '/wpcom/v2/memberships/status', {
			source: origin === 'https://wordpress.com' ? 'gutenberg-wpcom' : 'gutenberg',
		} );

		apiFetch( { path, method: 'GET' } ).then(
			result => {
				if ( ! result && typeof result !== 'object' ) {
					return;
				}
				if (
					result.errors &&
					Object.values( result.errors ) &&
					Object.values( result.errors )[ 0 ][ 0 ]
				) {
					setApiState( API_STATE_NOTCONNECTED );
					onError( Object.values( result.errors )[ 0 ][ 0 ] );
					return;
				}

				setConnectUrl( getConnectUrl( postId, result.connect_url ) );
				setShouldUpgrade( result.should_upgrade_to_access_memberships );
				setSiteSlug( result.site_slug );

				if (
					result.products &&
					0 === result.products.length &&
					! result.should_upgrade_to_access_memberships &&
					result.connected_account_id
				) {
					// Is ready to use and has no product set up yet. Let's create one!
					saveProduct(
						{
							title: __( 'Monthly Subscription', 'jetpack' ),
							currency: 'USD',
							price: 5,
							interval: '1 month',
						},
						() => {
							setApiState(
								result.connected_account_id ? API_STATE_CONNECTED : API_STATE_NOTCONNECTED
							);
						}
					);
					return;
				}

				if ( result.products && result.products.length > 0 ) {
					setProducts( result.products );
					if ( ! selectedProductId ) {
						selectProduct( result.products[ 0 ] );
					}
				}

				setApiState( result.connected_account_id ? API_STATE_CONNECTED : API_STATE_NOTCONNECTED );
			},
			result => {
				setConnectUrl( null );
				setApiState( API_STATE_NOTCONNECTED );
				onError( result.message );
			}
		);
	};

	return { fetchProducts, saveProduct, selectProduct };
}
