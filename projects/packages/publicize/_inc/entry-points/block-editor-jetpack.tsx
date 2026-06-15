import '../utils/public-path.js';
import { handleJetpackEditorAction } from '@automattic/jetpack-shared-extension-utils';
import { Fill } from '@wordpress/components';
import { registerPlugin } from '@wordpress/plugins';
import { SocialPanels } from '../components/block-editor/social-panels';
import { SocialSettings } from '../components/block-editor/social-settings';
import { getSocialScriptData } from '../utils';
import { handleSharePostAction } from '../utils/block-editor';

handleJetpackEditorAction( 'share_post', () => {
	return handleSharePostAction();
} );

/**
 * The Social UI needed for Jetpack sidebar
 *
 * @return The Jetpack sidebar UI for Social
 */
export function JetpackSidebar() {
	const { is_publicize_enabled, plugin_info } = getSocialScriptData() ?? {};

	// Don't render the Social section in the Jetpack sidebar when the Publicize
	// module is disabled and the standalone Jetpack Social plugin is not active.
	if ( ! is_publicize_enabled && ! plugin_info?.social?.version ) {
		return null;
	}

	return (
		<>
			<Fill name="JetpackPluginSidebar">
				<SocialSettings />
			</Fill>
			<SocialPanels />
		</>
	);
}

registerPlugin( 'jetpack-social', {
	render: () => <JetpackSidebar />,
} );
