import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	isAtomicSite,
	isPrivateSite,
	isSimpleSite,
	getJetpackData,
	isCurrentUserConnected,
	getSiteFragment,
	useAnalytics,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, PanelRow } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { external, Icon } from '@wordpress/icons';
import './editor.scss';
import BlazeIcon from './icon';

/**
 * Return the allowed file mime types for the site.
 *
 * @returns {object} Allowed Mime Types.
 */
function getConnectedUserLocale() {
	return getJetpackData()?.tracksUserData?.user_locale || 'en';
}

const BlazePostPublishPanel = () => {
	const panelBodyProps = {
		name: 'blaze-panel',
		title: __( 'Blaze this post', 'jetpack' ),
		className: 'blaze-panel',
		icon: <BlazeIcon />,
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

	const { tracks } = useAnalytics();
	const trackClick = useCallback(
		() => tracks.recordEvent( 'jetpack_editor_blaze_publish_click' ),
		[ tracks ]
	);

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
			<PanelRow>
				<p>
					{ __(
						'Reach a larger audience boosting the content to the WordPress.com community of blogs and sites.',
						'jetpack'
					) }
				</p>
			</PanelRow>
			<div
				role="link"
				className="post-publish-panel__postpublish-buttons"
				tabIndex={ 0 }
				onClick={ trackClick }
				onKeyDown={ trackClick }
			>
				<Button variant="secondary" href={ promoteUrl } target="_top">
					{ __( 'Blaze', 'jetpack' ) }{ ' ' }
					<Icon icon={ external } className="blaze-panel-outbound-link__external_icon" />
				</Button>
			</div>
		</PluginPostPublishPanel>
	);
};

export const name = 'blaze';
export const settings = {
	render: BlazePostPublishPanel,
};
