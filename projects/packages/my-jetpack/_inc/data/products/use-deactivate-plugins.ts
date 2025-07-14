import { useGlobalNotices } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import useAnalytics from '../../hooks/use-analytics';
import { QUERY_ACTIVATE_PRODUCT_KEY, REST_API_SITE_PRODUCTS_ENDPOINT } from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import { getMyJetpackWindowInitialState } from '../utils/get-my-jetpack-window-state';
import useProducts from './use-products';
import type { ProductCamelCase, ProductSnakeCase } from '../types';

const setPluginActiveState = ( productId: string ) => {
	const { items } = getMyJetpackWindowInitialState( 'products' );
	if ( items[ productId ]?.plugin_slug === 'jetpack' ) {
		return;
	}
	if ( items[ productId ]?.standalone_plugin_info.has_standalone_plugin ) {
		window.myJetpackInitialState.products.items[
			productId
		].standalone_plugin_info.is_standalone_active = false;
	}
};

const isPluginActive = ( detail: ProductCamelCase ) => {
	const { standalonePluginInfo } = detail;

	if ( standalonePluginInfo?.hasStandalonePlugin ) {
		return standalonePluginInfo?.isStandaloneActive;
	}

	return detail.isPluginActive;
};

export const useDeactivatePlugins = ( productSlugs: string | string[] ) => {
	const productIds = Array.isArray( productSlugs ) ? productSlugs : [ productSlugs ];

	const { products, refetch } = useProducts( productIds );
	const { recordEvent } = useAnalytics();

	const { createSuccessNotice } = useGlobalNotices();

	const {
		mutate: deactivate,
		isPending,
		isSuccess,
	} = useSimpleMutation< { [ key: string ]: ProductSnakeCase } >( {
		name: QUERY_ACTIVATE_PRODUCT_KEY,
		query: {
			path: `${ REST_API_SITE_PRODUCTS_ENDPOINT }/deactivate`,
			method: 'DELETE',
			data: { products: productIds },
		},
		options: {
			onSuccess: () => {
				products?.forEach( product => {
					if ( isPluginActive( product ) ) {
						recordEvent( 'jetpack_myjetpack_product_deactivated', {
							product: product.slug,
						} );

						// This is to handle an edge case where a user is redirected somewhere after activation
						// and goes back in the browser and "deactivates" the product again. This will manually update
						// the window state so that the tracking is not recorded twice for one deactivation.
						setPluginActiveState( product.slug );
					}
				} );
				refetch().then( () => {
					createSuccessNotice(
						sprintf(
							/* translators: %s is either the product name, i.e.- "Jetpack Backup" or the word "Plugins". */
							__( '%s deactivated successfully!', 'jetpack-my-jetpack' ),
							products?.length === 1 ? products[ 0 ].title : __( 'Plugins', 'jetpack-my-jetpack' )
						)
					);
				} );
			},
		},
		errorMessage: sprintf(
			// translators: %s is the Jetpack product name or comma seperated list of multiple Jetpack product names.
			__( 'There was a problem deactivating %s.', 'jetpack-my-jetpack' ),
			products?.map( product => product?.name ).join( ', ' )
		),
	} );

	return {
		deactivate,
		isPending,
		isSuccess,
	};
};
