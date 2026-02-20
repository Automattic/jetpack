import '../utils/public-path.js';
import { handleJetpackEditorAction } from '@automattic/jetpack-shared-extension-utils';
import { Fill } from '@wordpress/components';
import { registerPlugin } from '@wordpress/plugins';
import { SocialPanels } from '../components/block-editor/social-panels';
import { SocialSettings } from '../components/block-editor/social-settings';
import { handleSharePostAction } from '../utils/block-editor';

handleJetpackEditorAction( 'share_post', () => {
	return handleSharePostAction();
} );

/**
 * The Social UI needed for Jetpack sidebar
 *
 * @return The Jetpack sidebar UI for Social
 */
function JetpackSidebar() {
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
