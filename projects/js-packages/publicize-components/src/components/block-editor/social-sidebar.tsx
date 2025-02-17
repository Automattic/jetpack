import { SocialIcon } from '@automattic/jetpack-components';
import { PluginSidebar } from '@wordpress/editor';
import { registerPlugin } from '@wordpress/plugins';
import { SocialPanels } from './components/social-panels';
import { SocialSettings } from './components/social-settings';

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
