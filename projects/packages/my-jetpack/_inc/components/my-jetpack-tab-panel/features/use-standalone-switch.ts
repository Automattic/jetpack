import { useCallback } from 'react';
import { setPluginActiveState } from '../../../data/products/use-activate-plugins';
import { useDeactivatePlugins } from '../../../data/products/use-deactivate-plugins';
import useInstallPlugins from '../../../data/products/use-install-plugins';
import useProduct from '../../../data/products/use-product';
import type { ProductCamelCase } from '../../../data/types';

/**
 * Switch a feature by installing and activating its standalone plugin, or deactivating it.
 *
 * Install rather than activate: activating a hybrid product reports success without
 * touching the plugin while its module is already on, so it could never add the plugin.
 *
 * @param product - The product whose standalone plugin is the switch.
 * @param isOn    - Whether the plugin is currently installed and active.
 * @return The handler and whether a mutation is in flight.
 */
export function useStandaloneSwitch( product: ProductCamelCase, isOn: boolean ) {
	const { install, isPending: isInstalling } = useInstallPlugins( product.slug );
	const { deactivate, isPending: isDeactivating } = useDeactivatePlugins( product.slug );
	const { isLoading, isRefetching } = useProduct( product.slug );

	const setActive = useCallback( () => {
		if ( isOn ) {
			deactivate();
			return;
		}

		// The products endpoint omits the standalone plugin's state, so the page's copy
		// is what the switch reads; installing has to update it as activating does.
		install( undefined, { onSuccess: () => setPluginActiveState( product.slug ) } );
	}, [ deactivate, install, isOn, product.slug ] );

	return {
		setActive,
		isBusy: isInstalling || isDeactivating || isLoading || isRefetching,
	};
}
