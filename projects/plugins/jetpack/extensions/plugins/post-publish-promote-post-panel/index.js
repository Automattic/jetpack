import { JetpackLogo } from '@automattic/jetpack-components';
import {
	getSiteFragment,
	isAtomicSite,
	isPrivateSite,
	isSimpleSite,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, PanelBody, PanelRow } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar.js';
import './editor.scss';

export const name = 'post-publish-promote-post-panel';

export const settings = {
	render: function PluginPostPublishPanelPromotePost() {
		const panelBodyProps = {
			name: 'post-publish-promote-post-panel',
			title: __( 'Promote this post', 'jetpack' ),
			className: 'post-publish-promote-post-panel',
			icon: <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" />,
			initialOpen: true,
		};

		const isPostPublished = useSelect( select => {
			return select( editorStore ).isCurrentPostPublished();
		}, [] );

		const currentPostType = useSelect( select => {
			return select( editorStore ).getCurrentPostType();
		}, [] );

		function promoted_content_enabled( type ) {
			return type === 'post' || type === 'page' || type === 'product';
		}

		const currentPost = useSelect( select => {
			return select( editorStore ).getCurrentPost();
		}, [] );

		const currentPostId = currentPost?.id;

		const siteFragment = getSiteFragment();

		const targetLink = `https://wordpress.com/advertising/${ siteFragment }?blazepress-widget=post-${ currentPostId }`;

		const authorId = useSelect( select => {
			return select( 'core/editor' ).getEditedPostAttribute( 'author' );
		}, [] );

		const user = useSelect( select => {
			return select( 'core' ).getUser( authorId );
		}, [] );

		const isUserAdmin = user?.capabilities.administrator;
		const isWPCOMSite = isSimpleSite() || isAtomicSite();
		const isContentAllowed = promoted_content_enabled( currentPostType );

		const hasPromotedPosts = isUserAdmin && isContentAllowed && isWPCOMSite && ! isPrivateSite();

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
					<div className="qr-post-button">
						<Button isSecondary href={ targetLink }>
							{ __( 'Promote Post', 'jetpack' ) }
						</Button>
					</div>
				</>
			);
		}

		return (
			<>
				{ hasPromotedPosts && (
					<PluginPostPublishPanel { ...panelBodyProps }>
						<PromotePostPanelBodyContent />
					</PluginPostPublishPanel>
				) }

				{ isPostPublished && hasPromotedPosts && (
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
