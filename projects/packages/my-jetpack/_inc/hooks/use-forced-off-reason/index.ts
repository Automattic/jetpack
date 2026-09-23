import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useSelect } from '@wordpress/data';
import { getOverrideReason } from '../../components/modules-list/utils';
import { getProductModules } from '../../components/my-jetpack-tab-panel/products/mappings';
import { isJetpackPluginActive } from '../../utils/is-jetpack-plugin-active';
import type { MyJetpackModule } from '../../types';

/**
 * Why a product's card has nothing to offer, when a host forced its module off.
 *
 * @param slug - The product slug.
 * @return The reason, or null when nothing forced the module off.
 */
export default function useForcedOffReason( slug: JetpackModule ): string | null {
	const moduleSlug = getProductModules()[ slug ] || slug;

	const override = useSelect(
		select => {
			// Only the Jetpack plugin serves the module list, so asking without it fails every load.
			if ( ! isJetpackPluginActive() ) {
				return undefined;
			}

			const modules: Record< string, MyJetpackModule > | undefined =
				select( modulesStore ).getJetpackModules();

			return modules?.[ moduleSlug ]?.override;
		},
		[ moduleSlug ]
	);

	return override === 'inactive' ? getOverrideReason( 'inactive' ) : null;
}
