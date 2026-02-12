/**
 * Internal dependencies
 */
import getJetpackData from '../../get-jetpack-data';

/**
 * Determines if Jetpack branding should be shown in editor panels.
 *
 * Controlled via the `jetpack_show_editor_panel_branding` PHP filter.
 *
 * @return {boolean} Whether to show Jetpack branding in panels.
 */
export default function useShouldShowPanelBranding() {
	return getJetpackData()?.showEditorPanelBranding !== false;
}
