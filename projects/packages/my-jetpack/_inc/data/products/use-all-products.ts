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
		options: { enabled: true },
	} );

	if ( ! isLoading && ! isError ) {
		for ( const [ key, product ] of Object.entries( products ) ) {
			if ( fetchedProducts && fetchedProducts[ key ] ) {
				products[ key ] = { ...product, ...fetchedProducts[ key ] };
			}
		}
	}

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
			( acc, [ key, product ] ) => ( { ...acc, [ key ]: prepareProductData( product ) } ),
			{} as { [ key: string ]: ProductCamelCase }
		),
		refetch,
		isLoading,
		isRefetching,
		isError,
	};
};
