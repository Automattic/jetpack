import '../../utils/public-path.js';
import { SocialIcon } from '@automattic/jetpack-components';
import { handleJetpackEditorAction } from '@automattic/jetpack-shared-extension-utils';
import { PluginSidebar } from '@wordpress/editor';
import { registerPlugin } from '@wordpress/plugins';
import { SocialPanels } from './components/social-panels';
import { SocialSettings } from './components/social-settings';
import { handleSharePostAction } from './shared-utils';

handleJetpackEditorAction( 'share_post', () => {
	return handleSharePostAction( 'jetpack-social/jetpack-social' );
} );

/**
 * Social sidebar for the social plugin
 *
 * @return The social sidebar
 */
function SocialSidebar() {
	return (
		<>
			<PluginSidebar name="jetpack-social" title="Jetpack Social" icon={ <SocialIcon /> }>
				<SocialSettings />
			</PluginSidebar>
			<SocialPanels />
		</>
	);
}

registerPlugin( 'jetpack-social', {
	render: () => <SocialSidebar />,
} );
