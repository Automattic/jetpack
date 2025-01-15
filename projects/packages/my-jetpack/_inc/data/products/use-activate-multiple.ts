import { __, sprintf } from '@wordpress/i18n';
import useAnalytics from '../../hooks/use-analytics';
import { REST_API_SITE_PRODUCTS_ENDPOINT, QUERY_ACTIVATE_PRODUCT_KEY } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import { getMyJetpackWindowInitialState } from '../utils/get-my-jetpack-window-state';
import useProducts from './use-products';
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

const useActivateMultiple = ( productIds: string[] ) => {
	const { products, refetch } = useProducts( productIds );
	const { recordEvent } = useAnalytics();

	const {
		mutate: activate,
		isPending,
		isSuccess,
	} = useSimpleMutation( {
		name: QUERY_ACTIVATE_PRODUCT_KEY,
		query: {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/activate-multiple-plugins`,
			method: 'POST',
			data: { products: productIds },
		},
		options: {
			onSuccess: () => {
				products.forEach( product => {
					if ( ! getIsPluginAlreadyActive( product ) ) {
						recordEvent( 'jetpack_myjetpack_product_activated', {
							product: product.slug,
						} );

						// This is to handle an edge case where a user is redirected somewhere after activation
						// and goes back in the browser and "activates" the product again. This will manually update
						// the window state so that the tracking is not recorded twice for one activation.
						setPluginActiveState( product.slug );
					}
				} );
				refetch();
			},
		},
		errorMessage: sprintf(
			// translators: %s is the Jetpack product name or comma seperated list of multiple Jetpack product names.
			__( 'There was a problem activating %s.', 'jetpack-my-jetpack' ),
			products?.map( product => product.name ).join( ', ' )
		),
	} );

	return {
		activate,
		isPending,
		isSuccess,
	};
};

export default useActivateMultiple;
