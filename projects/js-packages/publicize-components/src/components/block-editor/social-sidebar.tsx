import { SocialIcon } from '@automattic/jetpack-components';
import { handleJetpackEditorAction } from '@automattic/jetpack-shared-extension-utils';
import { dispatch } from '@wordpress/data';
import { PluginSidebar } from '@wordpress/editor';
import { registerPlugin } from '@wordpress/plugins';
import { store as socialStore } from '../../social-store';
import { SocialPanels } from './components/social-panels';
import { SocialSettings } from './components/social-settings';

handleJetpackEditorAction( {
	sidebarToOpen: 'jetpack-social/jetpack-social',
	onAction( action ) {
		if ( action === 'share_post' ) {
			dispatch( socialStore ).openSharePostModal();
		}
	},
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
