import { __, sprintf } from '@wordpress/i18n';
import { REST_API_SITE_PRODUCTS_ENDPOINT, QUERY_INSTALL_PRODUCT_KEY } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import useProducts from './use-products';

const useInstallMultipleStandalonePlugins = ( productIds: string[] ) => {
	const { products, refetch } = useProducts( productIds );

	const { mutate: install, isPending } = useSimpleMutation( {
		name: QUERY_INSTALL_PRODUCT_KEY,
		query: {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/install-products-plugins`,
			method: 'POST',
			data: { products: productIds },
		},
		options: {
			onSuccess: refetch,
		},
		errorMessage: __(
			'Failed to install standalone plugins. Please try again',
			'jetpack-my-jetpack'
		),
	} );

	return {
		install,
		isPending,
	};
};

export default useInstallMultipleStandalonePlugins;
