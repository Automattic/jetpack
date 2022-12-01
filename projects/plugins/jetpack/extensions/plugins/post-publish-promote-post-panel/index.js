import { JetpackLogo } from '@automattic/jetpack-components';
import {
	// getSiteFragment,
	isAtomicSite,
	isPrivateSite,
	isSimpleSite,
} from '@automattic/jetpack-shared-extension-utils';
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
			initialOpen: true,
		};

		const isPostPublished = useSelect( select => {
			return select( editorStore ).isCurrentPostPublished();
		}, [] );

		// const currentPostType = useSelect( select => {
		// 	return select( editorStore ).getCurrentPostType();
		// }, [] );
		//
		// const currentPost = useSelect( select => {
		// 	console.log( select( editorStore ) );
		// 	return select( editorStore ).getCurrentPost();
		// }, [] );

		// const { getMedia, getUser } = select( 'core' );
		// const { getCurrentPost, getEditedPostAttribute } = select( 'core/editor' );

		// const authorId = useSelect(
		// 	theSelect => theSelect( 'core/editor' ).getEditedPostAttribute( 'author' ),
		// 	[]
		// );

		// const site = useSelect( theSelect => theSelect( 'core' ).getSite(), [] );
		// const user = useSelect( theSelect => theSelect( 'core' ).getUser( authorId ), [] ); // not valid, we still need to call wpcomapi
		// const post = useSelect( theSelect => theSelect( 'core/editor' ).getCurrentPost(), [] );
		// console.log( authorId );
		// console.log( site );
		// console.log( post );
		// console.log( user );
		// if ( user ) {
		// 	debugger;
		// }

		// console.log( 'postTYpe', currentPostType );
		// console.log( 'getCurrentPost', currentPost );
		// // console.log( 'woSite', woSite );
		// // console.log( 'test', test );

		const isWPCOMSite = isSimpleSite() || isAtomicSite();

		const hasPromotedPosts = isWPCOMSite && ! isPrivateSite();

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
