import { __, sprintf } from '@wordpress/i18n';
import useAnalytics from '../../hooks/use-analytics';
import { REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import { QUERY_ACTIVATE_PRODUCT_KEY } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import { getMyJetpackWindowInitialState } from '../utils/get-my-jetpack-window-state';
import useProduct from './use-product';
import type { ProductCamelCase } from '../types';

const setPluginActiveState = ( productId: string ) => {
	const { items } = getMyJetpackWindowInitialState( 'products' );
	if ( items[ productId ]?.standalone_plugin_info.has_standalone_plugin ) {
		window.myJetpackInitialState.products.items[
			productId
		].standalone_plugin_info.is_standalone_active = true;
		window.myJetpackInitialState.products.items[
			productId
		].standalone_plugin_info.is_standalone_installed = true;
	}
};

const getIsPluginAlreadyActive = ( detail: ProductCamelCase ) => {
	const { standalonePluginInfo, isPluginActive } = detail;

	if ( standalonePluginInfo?.hasStandalonePlugin ) {
		return standalonePluginInfo?.isStandaloneActive;
	}

	return isPluginActive;
};

const useActivate = ( productId: string ) => {
	const { detail, refetch } = useProduct( productId );
	const { recordEvent } = useAnalytics();

	const { mutate: activate, isPending } = useSimpleMutation( {
		name: QUERY_ACTIVATE_PRODUCT_KEY,
		query: {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/${ productId }`,
			method: 'POST',
		},
		options: {
			onSuccess: () => {
				if ( ! getIsPluginAlreadyActive( detail ) ) {
					recordEvent( 'jetpack_myjetpack_product_activated', {
						product: productId,
					} );

					// This is to handle an edge case where a user is redirected somewhere after activation
					// and goes back in the browser and "activates" the product again. This will manually update
					// the window state so that the tracking is not recorded twice for one activation.
					setPluginActiveState( productId );
				}
				refetch();
			},
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
