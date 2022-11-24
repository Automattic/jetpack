import { JetpackLogo } from '@automattic/jetpack-components';
import { PanelBody, PanelRow } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar.js';
import { PromotePostButton } from './components/promote-post.js';
import './editor.scss';

export const name = 'post-publish-promote-post-panel';

export const settings = {
	render: function PluginPostPublishPanelPromotePost() {
		const panelBodyProps = {
			name: 'post-publish-promote-post-panel',
			title: __( 'Promote this post', 'jetpack' ),
			className: 'post-publish-promote-post-panel',
			icon: <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" />,
		};

		const isPostPublished = useSelect(
			select => select( editorStore ).isCurrentPostPublished(),
			[]
		);

		function PromotePostPanelBodyContent() {
			return (
				<>
					<PanelRow>
						<p>
							{ __(
								'Reach a larger audience boosting the content to the WordPress.com community of blogs and sites.',
								'jetpack'
							) }
						</p>
					</PanelRow>
					<PromotePostButton />
				</>
			);
		}

		return (
			<>
				<PluginPostPublishPanel { ...panelBodyProps }>
					<PromotePostPanelBodyContent />
				</PluginPostPublishPanel>

				{ isPostPublished && (
					<JetpackPluginSidebar>
						<PanelBody { ...panelBodyProps }>
							<PromotePostPanelBodyContent />
						</PanelBody>
					</JetpackPluginSidebar>
				) }
			</>
		);
	},
};
