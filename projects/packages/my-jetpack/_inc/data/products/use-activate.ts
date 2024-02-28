import { REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import useGetProductData from './use-get-product-data';
import type { ProductSnakeCase } from '../types';
import type { UseMutationResult } from '@tanstack/react-query';

const useActivate: ( productId: string, status: 'activate' | 'deactivate' ) => UseMutationResult = (
	productId,
	status
) => {
	const { refetch } = useGetProductData( productId );
	const method = status === 'activate' ? 'POST' : 'DELETE';

	const queryResult = useSimpleMutation(
		`${ status }product`,
		{
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
			method,
		},
		{
			onSuccess: () =>
				// Update product data after activation/deactivation.
				refetch().then( refetchQueryResult => {
					const { data: refetchedProduct } = refetchQueryResult;

					window.myJetpackInitialState.products.items[ productId ] =
						refetchedProduct as ProductSnakeCase;
				} ),
		}
	);

	return queryResult;
};

export default useActivate;
