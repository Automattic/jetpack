import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useIsMutating } from '@tanstack/react-query';
import { useSelect } from '@wordpress/data';
import type { FeatureState } from './feature-state';

/**
 * Whether this feature's switch has a request in flight.
 *
 * The two kinds of control report from different places — a module through the modules
 * store, a plugin through its mutation — so both are asked and the control decides which
 * answer applies.
 *
 * @param state - Live state for the feature.
 * @return True while the feature is being switched.
 */
export function useFeatureBusy( state: FeatureState ): boolean {
	const { control } = state;
	const moduleSlug = control.kind === 'module' ? control.module.module : '';
	const plugin =
		control.kind === 'plugin' || control.kind === 'install-plugin' ? control.plugin : '';

	const isModuleUpdating = useSelect(
		select => Boolean( moduleSlug ) && select( modulesStore ).isModuleUpdating( moduleSlug ),
		[ moduleSlug ]
	);

	const isPluginMutating = useIsMutating( {
		mutationKey: [ 'my-jetpack-feature-plugin', plugin ],
	} );

	return moduleSlug ? isModuleUpdating : Boolean( plugin ) && isPluginMutating > 0;
}
