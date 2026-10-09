import { QUERY_PRODUCT_KEY, REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import useSimpleQuery from '../use-simple-query';
import { getMyJetpackWindowInitialState } from '../utils/get-my-jetpack-window-state';
import { prepareProductData } from '../utils/prepare-product-data';
import type { ProductCamelCase, ProductSnakeCase } from '../types';

export const useAllProducts = () => {
	const { items: products } = getMyJetpackWindowInitialState( 'products' );

	const {
		data: fetchedProducts,
		isLoading,
		isRefetching,
		isError,
		refetch,
	} = useSimpleQuery< { [ key: string ]: ProductSnakeCase } >( {
		name: `${ QUERY_PRODUCT_KEY }`,
		query: {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }`,
		},
		options: { enabled: true, refetchInterval: 5 * 60 * 1000, refetchOnWindowFocus: true },
	} );

	if ( ! products ) {
		return {
			data: {},
			isLoading: false,
			isError: false,
			isRefetching,
			refetch,
		};
	}

	return {
		data: Object.entries( products ).reduce(
			( acc, [ key, product ] ) => {
				const fetchedProduct = fetchedProducts?.[ key ];
				const prepared = prepareProductData( { ...product, ...fetchedProduct } );
				const missingAvailability =
					! isLoading && fetchedProduct?.pricing_for_ui?.available !== true;
				if ( prepared.isBundle && prepared.pricingForUi && ( isError || missingAvailability ) ) {
					prepared.pricingForUi.available = false;
					prepared.pricingForUi.terms = prepared.pricingForUi.terms?.map( term => ( {
						...term,
						available: false,
					} ) );
				}
				return { ...acc, [ key ]: prepared };
			},
			{} as { [ key: string ]: ProductCamelCase }
		),
		refetch,
		isLoading,
		isRefetching,
		isError,
	};
};
