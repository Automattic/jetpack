import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { getSocialScriptData } from '../../utils';

/**
 * Enable/disable the Social (Publicize) module from within the modernized
 * dashboard. Restores an in-product path to toggle the module for hosts where
 * the wp-admin module-toggles surface is unreachable — e.g. WordPress.com
 * Atomic sites on the Calypso interface, where Jetpack Settings → Sharing has
 * no menu entry (see umbrella #48824, which moved product visibility onto that
 * now-unreachable surface). Reloads on enable so the tabs, connection list and
 * settings hydrate for the freshly-active module, mirroring the legacy master
 * toggle.
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

	const toggleModule = useCallback( async () => {
		const enabling = ! isModuleActive;

		await updateSocialModuleSettings( { publicize: enabling } );

		// Reload when enabling so the connection list and settings hydrate for
		// the freshly-active module.
		if ( enabling && ! getSocialScriptData().is_publicize_enabled ) {
			window.location.reload();
		}
	}, [ isModuleActive, updateSocialModuleSettings ] );

	return { isModuleActive, isUpdating, toggleModule };
}
