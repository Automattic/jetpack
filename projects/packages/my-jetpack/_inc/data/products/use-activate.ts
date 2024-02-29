import { __, sprintf } from '@wordpress/i18n';
import { REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import useStateProduct from './use-state-product';
import type { UseMutateFunction } from '@tanstack/react-query';

const useActivate: ( productId: string ) => {
	activate: UseMutateFunction;
	isPending: boolean;
} = productId => {
	const { product, refetch } = useStateProduct( productId );

	const { mutate: activate, isPending } = useSimpleMutation(
		'activateProduct',
		{
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
			method: 'POST',
		},
		{
			onSuccess: async () => {
				// Await the refetch so the loading state is pending until this returns
				await refetch();
			},
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
