import { REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import useSimpleQuery from '../use-simple-query';
import mapObjectKeysToCamel from '../utils/to-camel';
import type { ProductCamelCase, ProductSnakeCase, StateProducts } from '../types';
import type { RefetchOptions, QueryObserverResult } from '@tanstack/react-query';

const getFullPricePerMonth = ( product: ProductCamelCase ) => {
	return product.pricingForUi.productTerm === 'year'
		? Math.round( ( product.pricingForUi.fullPrice / 12 ) * 100 ) / 100
		: product.pricingForUi.fullPrice;
};

const getDiscountPricePerMonth = ( product: ProductCamelCase ) => {
	return product.pricingForUi.productTerm === 'year'
		? Math.round( ( product.pricingForUi.discountPrice / 12 ) * 100 ) / 100
		: product.pricingForUi.discountPrice;
};

export const useAllProducts: () => StateProducts = () => {
	const initialState = window?.myJetpackInitialState;
	const products = initialState?.products?.items || {};

	return products;
};

// Create query to fetch new product data from the server
const useFetchProduct = ( productId: string ) => {
	const queryResult = useSimpleQuery(
		'product',
		{
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
		},
		{ enabled: false }
	);

	return queryResult;
};

// Fetch the product data from the server and update the global state
const refetchProduct: (
	productId: string,
	refetch: ( options?: RefetchOptions ) => Promise< QueryObserverResult< unknown, Error > >
) => Promise< void > = async ( productId, refetch ) => {
	return await refetch().then( refetchQueryResult => {
		const { data: refetchedProduct } = refetchQueryResult;

		window.myJetpackInitialState.products.items[ productId ] = refetchedProduct as ProductSnakeCase;
	} );
};

const useProduct: ( productId: string ) => {
	detail: ProductCamelCase;
	refetch: () => Promise< void >;
	isLoading: boolean;
} = productId => {
	const allProducts = useAllProducts();
	const product = allProducts?.[ productId ];
	const camelProduct = mapObjectKeysToCamel( product );
	const { refetch, isLoading } = useFetchProduct( productId );

	camelProduct.features = camelProduct.features || [];
	camelProduct.supportedProducts = camelProduct.supportedProducts || [];

	camelProduct.pricingForUi.fullPricePerMonth = getFullPricePerMonth( camelProduct );
	camelProduct.pricingForUi.discountPricePerMonth = getDiscountPricePerMonth( camelProduct );

	return {
		detail: camelProduct,
		refetch: () => refetchProduct( productId, refetch ),
		isLoading,
	};
};

export default useProduct;
