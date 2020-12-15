/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { external, Icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';

/**
 * Internal dependencies
 */
import { waitForEditor } from '../../shared/wait-for-editor';

/**
 * Style dependencies
 */
import './editor.scss';

async function insertSpotifyBadge() {
	const { Jetpack_AnchorFm = {} } = window;
	const { image, spotifyShowUrl } = Jetpack_AnchorFm;
	if ( ! spotifyShowUrl ) {
		return;
	}

	const { track = {} } = Jetpack_AnchorFm;

	await waitForEditor();

	const { insertBlock } = dispatch( 'core/block-editor' );
	const { editPost } = dispatch( 'core/editor' );
	const { isEditedPostNew } = select( 'core/editor' );

	insertBlock(
		createBlock( 'core/image', {
			url: image,
			linkDestination: 'none',
			href: spotifyShowUrl,
			align: 'center',
			width: 165,
			height: 40,
			className: 'is-spotify-podcast-badge',
		} ),
		0,
		undefined,
		false
	);

	// Set the post title when the post is new,
	// and it can be picked up from the podcast track.
	if ( isEditedPostNew() && track.title ) {
		editPost( { title: track.title } );
	}
}

const ConvertToAudio = () => (
	<PluginPostPublishPanel className="anchor-post-publish-outbound-link">
		<p className="post-publish-panel__postpublish-subheader">
			<strong>{ __( 'Convert to audio', 'jetpack' ) }</strong>
		</p>
		<p>{ __( 'Let your readers listen to your post.', 'jetpack' ) }</p>
		<p>
			<a href="https://anchor.fm/wordpress" target="_top">
				{ __( 'Create a podcast episode', 'jetpack' ) }
				<Icon icon={ external } className="anchor-post-publish-outbound-link__external_icon" />
			</a>
		</p>
	</PluginPostPublishPanel>
);

function showPostPublishOutboundLink() {
	registerPlugin( 'anchor-post-publish-outbound-link', {
		render: ConvertToAudio,
	} );
}

function initAnchor() {
	const data = window.Jetpack_AnchorFm;
	if ( typeof data !== 'object' ) {
		return;
	}

	switch ( data.action ) {
		case 'insert-spotify-badge':
			insertSpotifyBadge();
			break;
		case 'show-post-publish-outbound-link':
			showPostPublishOutboundLink();
			break;
	}
}

initAnchor();
