/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { PluginPrePublishPanel } from '@wordpress/edit-post';

/**
 * Internal dependencies
 */
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';
import SocialPreviewsPanel from './panel';
import SocialPreviewsModal from './modal';
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
