import { PanelBody } from '@wordpress/components';
import { PluginPrePublishPanel } from '@wordpress/edit-post';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import SocialPreviewsModal from './modal';
import SocialPreviewsPanel from './panel';
import './editor.scss';

export const name = 'social-previews';

export const settings = {
	render: () => <SocialPreviews />,
};

export const SocialPreviews = function SocialPreviews( { showUpgradeNudge } ) {
	const [ isOpened, setIsOpened ] = useState( false );

	return (
		<>
			{ isOpened && (
				<SocialPreviewsModal
					showUpgradeNudge={ showUpgradeNudge }
					onClose={ () => setIsOpened( false ) }
				/>
			) }
			<JetpackPluginSidebar>
				<PanelBody title={ __( 'Social Previews', 'jetpack' ) }>
					<SocialPreviewsPanel
						openModal={ () => setIsOpened( true ) }
						showUpgradeNudge={ showUpgradeNudge }
					/>
				</PanelBody>
			</JetpackPluginSidebar>
			<PluginPrePublishPanel title={ __( 'Social Previews', 'jetpack' ) }>
				<SocialPreviewsPanel
					openModal={ () => setIsOpened( true ) }
					showUpgradeNudge={ showUpgradeNudge }
				/>
			</PluginPrePublishPanel>
		</>
	);
};
