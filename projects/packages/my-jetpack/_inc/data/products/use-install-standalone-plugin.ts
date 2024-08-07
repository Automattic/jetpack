import { __, sprintf } from '@wordpress/i18n';
import { REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import { QUERY_INSTALL_PRODUCT_KEY } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import useProduct from './use-product';
import type { APIFetchOptionsWithQueryParams } from '../use-simple-mutation';
import type { UseMutateFunction } from '@tanstack/react-query';

export type InstallAction = UseMutateFunction<
	void,
	Error,
	APIFetchOptionsWithQueryParams,
	unknown
>;

type UseInstallStandalonePluginFunction = ( productId: string ) => {
	install: InstallAction;
	isPending: boolean;
};

const useInstallStandalonePlugin: UseInstallStandalonePluginFunction = productId => {
	const { detail, refetch } = useProduct( productId );

	const { mutate: install, isPending } = useSimpleMutation( {
		name: QUERY_INSTALL_PRODUCT_KEY,
		query: {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }/install-standalone`,
			method: 'POST',
		},
		options: {
			onSuccess: refetch,
		},
		errorMessage: sprintf(
			// translators: %$1s: Jetpack Product name
			__( 'Failed to install standalone plugin for %1$s. Please try again', 'jetpack-my-jetpack' ),
			detail.name
		),
	} );

	return {
		install,
		isPending,
	};
};

export default useInstallStandalonePlugin;
