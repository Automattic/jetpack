import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, PanelRow } from '@wordpress/components';
import { usePrevious } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { store as editorStore } from '@wordpress/editor';
import { useCallback, useEffect } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { external, Icon } from '@wordpress/icons';
import { getPlugin, registerPlugin } from '@wordpress/plugins';
import './editor.scss';
import BlazeIcon from './icon';

const BlazePostPublishPanel = () => {
	const { blazeUrlTemplate } = window?.blazeInitialState || {};
	const { tracks } = useAnalytics();

	// Tracks event when clicking on the Blaze link.
	const trackClick = useCallback(
		() => tracks.recordEvent( 'jetpack_editor_blaze_publish_click' ),
		[ tracks ]
	);

	const { isPostPublished, isPublishingPost, postId, postType, postTypeLabel, postVisibility } =
		useSelect( selector => ( {
			isPostPublished: selector( editorStore ).isCurrentPostPublished(),
			isPublishingPost: selector( editorStore ).isPublishingPost(),
			postId: selector( editorStore ).getCurrentPostId(),
			postType: selector( editorStore ).getCurrentPostType(),
			postTypeLabel:
				// Translators: default post type label.
				selector( editorStore ).getPostTypeLabel() || _x( 'Post', 'noun', 'jetpack-blaze' ),
			postVisibility: selector( editorStore ).getEditedPostVisibility(),
		} ) );
	const wasPublishing = usePrevious( isPublishingPost );

	const panelBodyProps = {
		name: 'blaze-panel',
		title: __( 'Promote with Blaze', 'jetpack-blaze' ),
		className: 'blaze-panel',
		icon: <BlazeIcon />,
		initialOpen: true,
	};

	const blazeUrl = blazeUrlTemplate.link.replace( '__POST_ID__', postId );

	// Decide when the panel should appear, and be tracked.
	const shouldDisplayPanel = () => {
		// Only show the panel for Posts, Pages, and Products.
		if ( ! [ 'page', 'post', 'product' ].includes( postType ) ) {
			return false;
		}

		// If the post is not published, or published with a password or private, do not show the panel.
		if ( ! isPostPublished || postVisibility === 'password' || postVisibility === 'private' ) {
			return false;
		}

		return true;
	};

	// Tracks event for the display of the panel.
	useEffect( () => {
		if ( ! ( wasPublishing && ! isPublishingPost ) ) {
			return;
		}

		if ( ! shouldDisplayPanel() ) {
			return;
		}

		if ( ! isPostPublished ) {
			return;
		}

		tracks.recordEvent( 'jetpack_editor_blaze_post_publish_panel_view' );
	}, [ tracks, isPublishingPost, isPostPublished, wasPublishing ] );

	if ( ! shouldDisplayPanel() ) {
		return null;
	}

	return (
		<PluginPostPublishPanel { ...panelBodyProps }>
			<PanelRow>
				<p>
					{ __(
						'Reach a larger audience boosting the content to the WordPress.com community of blogs and sites.',
						'jetpack-blaze'
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
				<Button variant="secondary" href={ blazeUrl } target="_top">
					{ sprintf(
						/* translators: %s is the post type (e.g. Post, Page, Product). */
						__( 'Blaze this %s', 'jetpack-blaze' ),
						postTypeLabel.toLowerCase()
					) }
					{ blazeUrlTemplate.external && (
						<Icon icon={ external } className="blaze-panel-outbound-link__external_icon" />
					) }
				</Button>
			</div>
		</PluginPostPublishPanel>
	);
};

// Check if a plugin with the same name has already been registered.
if ( ! getPlugin( 'jetpack-blaze' ) ) {
	// If not, register our plugin.
	registerPlugin( 'jetpack-blaze', {
		render: BlazePostPublishPanel,
	} );
}
