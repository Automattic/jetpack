import { store as modulesStore } from '@automattic/jetpack-shared-stores';
import { useSelect } from '@wordpress/data';
import { getOverrideReason } from '../../components/modules-list/utils';
import { getProductModules } from '../../components/my-jetpack-tab-panel/products/mappings';
import { PRODUCT_STATUSES } from '../../constants';
import { isJetpackPluginActive } from '../../utils/is-jetpack-plugin-active';
import type { MyJetpackModule } from '../../types';

// A card only offers to activate or buy in these; a host's override has nothing to replace elsewhere.
const OFFER_STATUSES: string[] = [
	PRODUCT_STATUSES.INACTIVE,
	PRODUCT_STATUSES.MODULE_DISABLED,
	PRODUCT_STATUSES.NEEDS_ACTIVATION,
	PRODUCT_STATUSES.NEEDS_PLAN,
];

/**
 * Why a product's card has nothing to offer, when a host forced its module off.
 *
 * @param slug   - The product slug.
 * @param status - The product's status.
 * @return The reason, or null when nothing forced the module off, and whether that is still unknown.
 */
export default function useForcedOffReason(
	slug: JetpackModule,
	status: string
): { reason: string | null; isPending: boolean } {
	// The Products tab maps Backup to vaultpress, but Backup's status never depends on a module.
	const moduleSlug = slug === 'backup' ? null : getProductModules()[ slug ] || slug;
	const applies = !! moduleSlug && OFFER_STATUSES.includes( status );

	const { override, isPending } = useSelect(
		select => {
			// Only the Jetpack plugin serves the module list, so asking without it fails every load.
			if ( ! applies || ! isJetpackPluginActive() ) {
				return { override: undefined, isPending: false };
			}

			const modules: Record< string, MyJetpackModule > | undefined =
				select( modulesStore ).getJetpackModules();

			return {
				override: modules?.[ moduleSlug ]?.override,
				isPending: ! select( modulesStore ).hasFinishedResolution( 'getJetpackModules', [] ),
			};
		},
		[ applies, moduleSlug ]
	);

	return { reason: override === 'inactive' ? getOverrideReason( 'inactive' ) : null, isPending };
}
