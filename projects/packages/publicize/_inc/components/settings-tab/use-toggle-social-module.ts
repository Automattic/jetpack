import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { store as socialStore } from '../../social-store';

/**
 * Read the Social (Publicize) module state and toggle it from within the
 * modernized dashboard. Used by the Settings tab's master on/off card, which
 * only renders while the module is active — so in practice this turns it *off*;
 * the enable-and-reload flow lives in the page shell (`stage.tsx`). Restores an
 * in-product path to toggle the module for hosts where the wp-admin
 * module-toggles surface is unreachable — e.g. WordPress.com Atomic sites on the
 * Calypso interface, where Jetpack Settings → Sharing has no menu entry (see
 * umbrella #48824, which moved product visibility onto that now-unreachable
 * surface).
 *
 * @return The module state, a saving flag, and a toggle callback.
 */
export default function useToggleSocialModule() {
	const { isModuleActive, isUpdating } = useSelect( select => {
		const store = select( socialStore );

		return {
			isModuleActive: store.getSocialModuleSettings().publicize,
			isUpdating: store.isSavingSocialModuleSettings(),
		};
	}, [] );

	const { updateSocialModuleSettings } = useDispatch( socialStore );

	// `next` is the target state ToggleControl hands us; fall back to inverting
	// the current state for no-arg callers.
	const toggleModule = useCallback(
		( next?: boolean ) => updateSocialModuleSettings( { publicize: next ?? ! isModuleActive } ),
		[ isModuleActive, updateSocialModuleSettings ]
	);

	return useMemo(
		() => ( { isModuleActive, isUpdating, toggleModule } ),
		[ isModuleActive, isUpdating, toggleModule ]
	);
}
