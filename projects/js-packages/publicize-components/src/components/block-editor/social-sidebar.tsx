import { SocialIcon } from '@automattic/jetpack-components';
import { dispatch } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { PluginSidebar } from '@wordpress/editor';
import { store as interfaceStore } from '@wordpress/interface';
import { registerPlugin } from '@wordpress/plugins';
import { getQueryArg } from '@wordpress/url';
import { SocialPanels } from './components/social-panels';
import { SocialSettings } from './components/social-settings';

/**
 * Open Jetpack Social sidebar by default when URL includes jetpackSidebarIsOpen=true.
 */
domReady( () => {
	if ( getQueryArg( window.location.search, 'jetpackSidebarIsOpen' ) === 'true' ) {
		dispatch( interfaceStore ).enableComplementaryArea( 'core', 'jetpack-social/jetpack-social' );
	}
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
