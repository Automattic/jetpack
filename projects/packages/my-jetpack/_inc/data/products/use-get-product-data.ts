import { REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import useSimpleQuery from '../use-simple-query';
import mapObjectKeysToCamel from '../utils/to-camel';
import useAllProducts from './use-all-products';
import type { ProductCamelCase } from '../types';
import type { UseQueryResult } from '@tanstack/react-query';

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

const useRefetchProduct = ( productId: string ) => {
	const queryResult = useSimpleQuery(
		'product',
		{
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
		},
		{ enabled: false }
	);

	return queryResult;
};

const useGetProductData: ( productId: string ) => {
	product: ProductCamelCase;
	refetch: ( options?: {
		throwOnError?: boolean;
		cancelRefetch?: boolean;
	} ) => Promise< UseQueryResult >;
	isLoading: boolean;
} = productId => {
	const allProducts = useAllProducts();
	const product = allProducts?.[ productId ];
	const camelProduct = mapObjectKeysToCamel( product );

	camelProduct.features = camelProduct.features || [];
	camelProduct.supportedProducts = camelProduct.supportedProducts || [];

	camelProduct.pricingForUi.fullPricePerMonth = getFullPricePerMonth( camelProduct );
	camelProduct.pricingForUi.discountPricePerMonth = getDiscountPricePerMonth( camelProduct );

	const { refetch, isLoading } = useRefetchProduct( productId );

	return {
		product: camelProduct,
		refetch,
		isLoading,
	};
};

export default useGetProductData;
