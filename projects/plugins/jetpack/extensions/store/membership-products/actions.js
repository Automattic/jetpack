import formatCurrency from '@automattic/format-currency';
import apiFetch from '@wordpress/api-fetch';
import { __, sprintf } from '@wordpress/i18n';
import { PRODUCT_TYPE_PAYMENT_PLAN } from '../../shared/components/product-management-controls/constants';
import { getMessageByProductType } from '../../shared/components/product-management-controls/utils';
import { isPriceValid, minimumTransactionAmountForCurrency } from '../../shared/currencies';
import { STORE_NAME } from './constants';
import { onError, onSuccess } from './utils';

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
	productType = PRODUCT_TYPE_PAYMENT_PLAN,
	setSelectedProductId = () => {},
	callback = () => {}
) => async ( { dispatch, registry } ) => {
	const { title, price, currency } = product;

	if ( ! title || 0 === title.length ) {
		onError( getMessageByProductType( 'product requires a name', productType ), registry );
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
			),
			registry
		);
		callback( false );
		return;
	}
	if ( ! isPriceValid( currency, parsedPrice ) ) {
		onError( getMessageByProductType( 'product requires a valid price', productType ), registry );
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
			buyer_can_change_amount: response?.buyer_can_change_amount,
		};

		const products = registry.select( STORE_NAME ).getProducts();

		dispatch( setProducts( products.concat( [ newProduct ] ) ) );
		setSelectedProductId( newProduct.id, newProduct );
		onSuccess( getMessageByProductType( 'successfully created product', productType ), registry );
		callback( true );
	} catch ( error ) {
		onError(
			getMessageByProductType( 'there was an error when adding the product', productType ),
			registry
		);
		callback( false );
	}
};
