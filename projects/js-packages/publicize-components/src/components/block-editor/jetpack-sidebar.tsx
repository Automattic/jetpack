import { handleJetpackEditorAction } from '@automattic/jetpack-shared-extension-utils';
import { Fill } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { registerPlugin } from '@wordpress/plugins';
import { store as socialStore } from '../../social-store';
import { SocialPanels } from './components/social-panels';
import { SocialSettings } from './components/social-settings';

handleJetpackEditorAction( {
	onAction( action ) {
		if ( action === 'share_post' ) {
			dispatch( socialStore ).openSharePostModal();
		}
	},
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
