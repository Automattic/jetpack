import { REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import useGetProductData from './use-get-product-data';
import type { ProductSnakeCase } from '../types';
import type { UseMutateFunction } from '@tanstack/react-query';

const useActivate: ( productId: string ) => {
	activate: UseMutateFunction;
	isPending: boolean;
} = productId => {
	const { refetch } = useGetProductData( productId );

	const { mutate: activate, isPending } = useSimpleMutation(
		`$activateProduct`,
		{
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
			method: 'POST',
		},
		{
			onSuccess: () =>
				// Update product data after activation.
				refetch().then( refetchQueryResult => {
					const { data: refetchedProduct } = refetchQueryResult;

					window.myJetpackInitialState.products.items[ productId ] =
						refetchedProduct as ProductSnakeCase;
				} ),
		}
	);

	return {
		activate,
		isPending: isPending,
	};
};

export default useActivate;
