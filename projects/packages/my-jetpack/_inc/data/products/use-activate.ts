import { __, sprintf } from '@wordpress/i18n';
import { REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import { QUERY_ACTIVATE_PRODUCT_KEY } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import useProduct from './use-product';

const useActivate = ( productId: string ) => {
	const { detail, refetch } = useProduct( productId );

	const { mutate: activate, isPending } = useSimpleMutation( {
		name: QUERY_ACTIVATE_PRODUCT_KEY,
		query: {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
			method: 'POST',
		},
		options: {
			onSuccess: refetch,
		},
		errorMessage: sprintf(
			// translators: %$1s: Jetpack Product name
			__( 'Failed to activate %1$s. Please try again', 'jetpack-my-jetpack' ),
			detail.name
		),
	} );

	return {
		activate,
		isPending,
	};
};

export default useActivate;
