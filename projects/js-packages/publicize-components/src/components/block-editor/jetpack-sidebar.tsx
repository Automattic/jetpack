import { Fill } from '@wordpress/components';
import { registerPlugin } from '@wordpress/plugins';
import { SocialPanels } from './components/social-panels';
import { SocialSettings } from './components/social-settings';

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
