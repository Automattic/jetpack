/**
 * External dependencies
 */
import formatCurrency from '@automattic/format-currency';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './constants';
import { onError, onSuccess } from './utils';
import { isPriceValid, minimumTransactionAmountForCurrency } from '../../shared/currencies';

export const setProducts = products => ( {
	type: 'SET_PRODUCTS',
	products,
} );

export const setConnectUrl = connectUrl => ( {
	type: 'SET_CONNECT_URL',
	connectUrl,
} );

export const setApiState = apiState => ( {
	type: 'SET_API_STATE',
	apiState,
} );

export const setShouldUpgrade = shouldUpgrade => ( {
	type: 'SET_SHOULD_UPGRADE',
	shouldUpgrade,
} );

export const setSiteSlug = siteSlug => ( {
	type: 'SET_SITE_SLUG',
	siteSlug,
} );

export const setUpgradeUrl = upgradeUrl => ( {
	type: 'SET_UPGRADE_URL',
	upgradeUrl,
} );

export const saveProduct = (
	product,
	setSelectedProductId = () => {},
	callback = () => {}
) => async ( { dispatch, registry } ) => {
	const { title, price, currency } = product;

	if ( ! title || 0 === title.length ) {
		onError( __( 'Plan requires a name', 'jetpack' ), registry );
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
		onError( __( 'Plan requires a valid price', 'jetpack' ), registry );
		callback( false );
		return;
	}

	try {
		const response = await apiFetch( {
			path: '/wpcom/v2/memberships/product',
			method: 'POST',
			data: product,
		} );

		const newProduct = {
			id: response.id,
			title: response.title,
			interval: response.interval,
			price: response.price,
			currency: response.currency,
		};

		const products = registry.select( STORE_NAME ).getProducts();

		dispatch( setProducts( products.concat( [ newProduct ] ) ) );
		setSelectedProductId( newProduct.id );
		onSuccess( __( 'Successfully created plan', 'jetpack' ), registry );
		callback( true );
	} catch ( error ) {
		onError( __( 'There was an error when adding the plan.', 'jetpack' ), registry );
		callback( false );
	}
};
