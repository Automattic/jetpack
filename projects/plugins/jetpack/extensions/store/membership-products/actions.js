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

export const setConnectedAccountDefaultCurrency = connectedAccountDefaultCurrency => ( {
	type: 'SET_CONNECTED_ACCOUNT_DEFAULT_CURRENCY',
	connectedAccountDefaultCurrency,
} );

export const setApiState = apiState => ( {
	type: 'SET_API_STATE',
	apiState,
} );

export const setSiteSlug = siteSlug => ( {
	type: 'SET_SITE_SLUG',
	siteSlug,
} );

export const saveProduct =
	(
		product,
		productType = PRODUCT_TYPE_PAYMENT_PLAN,
		setSelectedProductId = () => {},
		callback = () => {},
		shouldDisplayProductCreationNotice = true
	) =>
	async ( { dispatch, registry } ) => {
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
			};

			const products = registry.select( STORE_NAME ).getProducts();

			dispatch( setProducts( products.concat( [ newProduct ] ) ) );
			setSelectedProductId( newProduct.id );
			if ( shouldDisplayProductCreationNotice ) {
				onSuccess(
					getMessageByProductType( 'successfully created product', productType ),
					registry
				);
			}
			callback( true );
		} catch ( error ) {
			onError(
				getMessageByProductType( 'there was an error when adding the product', productType ),
				registry
			);
			callback( false );
		}
	};

export const setSubscriberCounts = subscriberCounts => ( {
	type: 'SET_SUBSCRIBER_COUNTS',
	subscriberCounts,
} );
