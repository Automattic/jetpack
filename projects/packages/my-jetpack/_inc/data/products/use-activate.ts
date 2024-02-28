import { __, sprintf } from '@wordpress/i18n';
import { REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import useGetProductData from './use-get-product-data';
import type { ProductSnakeCase } from '../types';
import type { UseMutateFunction } from '@tanstack/react-query';

const useActivate: ( productId: string ) => {
	activate: UseMutateFunction;
	isPending: boolean;
} = productId => {
	const { product, refetch } = useGetProductData( productId );

	const { mutate: activate, isPending } = useSimpleMutation(
		'activateProduct',
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
		},
		null,
		sprintf(
			// translators: %$1s: Jetpack Product name
			__( 'Failed to activate %1$s. Please try again', 'jetpack-my-jetpack' ),
			product.name
		)
	);

	return {
		activate,
		isPending,
	};
};

export default useActivate;
