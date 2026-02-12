/**
 * External dependencies
 */
import hasFeatureFlag from '../../has-feature-flag';

/**
 * Determines if Jetpack branding should be shown in editor panels.
 *
 * Branding should be shown in global contexts (Document settings panel,
 * Pre-publish panel, Post-publish panel) but NOT in local contexts
 * (Jetpack sidebar) and NOT on CIAB (Core in a Box) sites.
 *
 * @return {boolean} Whether to show Jetpack branding in panels.
 */
export default function useShouldShowPanelBranding() {
	// Check if we should hide branding (e.g., for CIAB sites)
	// This can be controlled via the jetpack_block_editor_feature_flags PHP filter
	const hideBranding = hasFeatureFlag( 'hide-panel-branding' );

	return ! hideBranding;
}
