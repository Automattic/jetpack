import { __, sprintf } from '@wordpress/i18n';
import { REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import useGetProductData from './use-get-product-data';
import type { ProductSnakeCase } from '../types';
import type { UseMutateFunction } from '@tanstack/react-query';

const useInstallStandalonePlugin: ( productId: string ) => {
	install: UseMutateFunction;
	isPending: boolean;
} = productId => {
	const { product, refetch } = useGetProductData( productId );

	const { mutate: install, isPending } = useSimpleMutation(
		'installPlugin',
		{
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }/install-standalone`,
			method: 'POST',
		},
		{
			onSuccess: () => {
				refetch().then( refetchQueryResult => {
					const { data: refetchedProduct } = refetchQueryResult;

					window.myJetpackInitialState.products.items[ productId ] =
						refetchedProduct as ProductSnakeCase;
				} );
			},
		},
		null,
		sprintf(
			// translators: %$1s: Jetpack Product name
			__( 'Failed to install standalone plugin for %1$s. Please try again', 'jetpack-my-jetpack' ),
			product.name
		)
	);

	return {
		install,
		isPending,
	};
};

export default useInstallStandalonePlugin;
