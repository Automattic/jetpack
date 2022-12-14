import { getRedirectUrl, JetpackLogo } from '@automattic/jetpack-components';
import {
	isAtomicSite,
	isPrivateSite,
	isSimpleSite,
	getJetpackData,
	isCurrentUserConnected,
	getSiteFragment,
} from '@automattic/jetpack-shared-extension-utils';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import analytics from '../../../_inc/client/lib/analytics';

/**
 * Return the allowed file mime types for the site.
 *
 * @returns {object} Allowed Mime Types.
 */
function getConnectedUserLocale() {
	return getJetpackData()?.tracksUserData?.user_locale || 'en';
}

const PluginPostPublishPanelPromotePost = () => {
	const panelBodyProps = {
		name: 'post-publish-promote-post-panel',
		title: __( 'Promote this post', 'jetpack' ),
		className: 'post-publish-promote-post-panel',
		icon: <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" />,
		initialOpen: true,
	};

	const { isPostPublished, postId, postType, postVisibility } = useSelect( selector => ( {
		isPostPublished: selector( editorStore ).isCurrentPostPublished(),
		postId: selector( editorStore ).getCurrentPostId(),
		postType: selector( editorStore ).getCurrentPostType(),
		postVisibility: selector( editorStore ).getEditedPostVisibility(),
	} ) );

	const promoteUrl = getRedirectUrl( 'jetpack-promote-posts', {
		site: getSiteFragment(),
		query: `blazepress-widget=post-${ postId }`,
	} );

	const trackClick = () => {
		analytics.tracks.recordEvent( 'jetpack_editor_promote_post_publish_click' );
	};

	// Only show the panel for Posts, Pages, and Products.
	if ( ! [ 'page', 'post', 'product' ].includes( postType ) ) {
		return null;
	}

	// Only show the panel for WPCOM sites.
	const isWPCOMSite = isSimpleSite() || isAtomicSite();
	if ( ! isWPCOMSite ) {
		return null;
	}

	// Only show the panel for public sites.
	if ( isPrivateSite() ) {
		return null;
	}

	// Do not show the panel if the current user is not connected
	// and thus does not have access to the Advertising tools.
	if ( ! isCurrentUserConnected() ) {
		return null;
	}

	// Only show the panel to WordPress.com users with interface set to English.
	if ( ! [ 'en', 'en-gb' ].includes( getConnectedUserLocale() ) ) {
		return null;
	}

	// If the post is not published, or published with a password or private, do not show the panel.
	if ( ! isPostPublished || postVisibility === 'password' || postVisibility === 'private' ) {
		return null;
	}

	return (
		<PluginPostPublishPanel { ...panelBodyProps }>
			<p>
				{ __(
					'Reach a larger audience boosting the content to the WordPress.com community of blogs and sites.',
					'jetpack'
				) }
			</p>
			<p>
				<ExternalLink href={ promoteUrl } onClick={ trackClick }>
					{ __( 'Promote Post', 'jetpack' ) }
				</ExternalLink>
			</p>
		</PluginPostPublishPanel>
	);
};

export const name = 'post-publish-promote-post-panel';
export const settings = {
	render: PluginPostPublishPanelPromotePost,
};
