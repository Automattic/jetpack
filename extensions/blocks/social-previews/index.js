/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import SocialPreviewsPanel from './panel';
import './editor.scss';

export const name = 'social-previews';

export const settings = {
	render: () => <SocialPreviews />,
};

export const SocialPreviews = function SocialPreviews( { showUpgradeNudge } ) {
	return (
		<JetpackPluginSidebar>
			<PanelBody title={ __( 'Social Previews', 'jetpack' ) }>
				<SocialPreviewsPanel showUpgradeNudge={ showUpgradeNudge } />
			</PanelBody>
		</JetpackPluginSidebar>
	);
};
