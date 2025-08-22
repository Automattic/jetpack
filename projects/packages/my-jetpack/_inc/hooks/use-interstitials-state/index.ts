import { useCallback, useMemo } from 'react';
import {
	QUERY_PRODUCT_INTERSTITIALS_KEY,
	REST_API_SITE_PRODUCTS_INTERSTITIALS_ENDPOINT,
} from '../../data/constants';
import { ProductCamelCase } from '../../data/types';
import useSimpleMutation from '../../data/use-simple-mutation';
import useSimpleQuery from '../../data/use-simple-query';

interface InterstitialsData {
	products: { [ Key in ProductCamelCase[ 'slug' ] ]?: boolean };
}

/**
 * Custom hook to manage interstitials state.
 *
 * @return The interstitials state and actions.
 */
export function useInterstitialsState() {
	const { data, isLoading, error, refetch } = useSimpleQuery< InterstitialsData >( {
		name: QUERY_PRODUCT_INTERSTITIALS_KEY,
		query: { path: REST_API_SITE_PRODUCTS_INTERSTITIALS_ENDPOINT },
	} );

	const { mutate, isPending } = useSimpleMutation< InterstitialsData >( {
		name: QUERY_PRODUCT_INTERSTITIALS_KEY + '-update',
		query: {
			path: REST_API_SITE_PRODUCTS_INTERSTITIALS_ENDPOINT,
			method: 'POST',
		},
		options: {
			onSuccess: () => {
				refetch();
			},
		},
	} );

	const update = useCallback(
		( products: InterstitialsData[ 'products' ], options: Parameters< typeof mutate >[ 1 ] ) => {
			mutate( { data: { products } }, options );
		},
		[ mutate ]
	);

	return useMemo(
		() => ( {
			data: data?.products,
			isLoading,
			isUpdating: isPending,
			update,
			error,
		} ),
		[ data, isLoading, error, isPending, update ]
	);
}
