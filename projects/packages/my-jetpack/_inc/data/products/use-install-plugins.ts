import { __, sprintf } from '@wordpress/i18n';
import { REST_API_SITE_PRODUCTS_ENDPOINT, QUERY_INSTALL_PRODUCT_KEY } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import useProducts from './use-products';

const useInstallPlugins = ( productIds: string[] ) => {
	const { products, refetch } = useProducts( productIds );

	const { mutate: install, isPending } = useSimpleMutation( {
		name: QUERY_INSTALL_PRODUCT_KEY,
		query: {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/install`,
			method: 'POST',
			data: { products: productIds },
		},
		options: {
			onSuccess: refetch,
		},
		errorMessage: sprintf(
			// translators: %s is the Jetpack product name or comma seperated list of multiple Jetpack product names.
			__( 'There was a problem installing and activating %s.', 'jetpack-my-jetpack' ),
			products?.map( product => product.name ).join( ', ' )
		),
	} );

	return {
		install,
		isPending,
	};
};

export default useInstallPlugins;
