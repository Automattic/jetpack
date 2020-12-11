/**
 * WordPress dependencies
 */
import { dispatch, select } from '@wordpress/data';

import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { external, Icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { addFilter } from '@wordpress/hooks';
import {
	useBlockEditContext,
	BlockControls,
} from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { name } from '.';
import getJetpackExtensionAvailability from '../../shared/get-jetpack-extension-availability';
import { waitForEditor } from '../../shared/wait-for-editor';
import buidlTemplate from './basic-template';

async function insertSpotifyBadge() {
	const { Jetpack_AnchorFm = {} } = window;
	const { image, spotifyShowUrl } = Jetpack_AnchorFm;
	if ( ! spotifyShowUrl ) {
		return;
	}

	const { track = {} } = Jetpack_AnchorFm;

	const templateParams = {
		podcastLink: track?.link,
		spotifyShowUrl,
		spotifyImageUrl: image,
		track,
	};

	await waitForEditor();

	const { editPost } = dispatch( 'core/editor' );
	const { isEditedPostNew } = select( 'core/editor' );

	// Set the post title when the post is new,
	// and it can be picked up from the podcast track.
	if ( isEditedPostNew() && track.title ) {
		editPost( { title: track.title } );
	}

	// Build and insert podcast episode post content.
	const { insertBlocks } = dispatch( 'core/block-editor' );
	insertBlocks(
		buidlTemplate( templateParams ),
		0,
		undefined,
		false
	);
}

const ConvertToAudio = () => (
	<PluginPostPublishPanel>
		<p className="post-publish-panel__postpublish-subheader">
			<strong>{ __( 'Convert to audio', 'jetpack' ) }</strong>
		</p>
		<p>{ __( 'Let your readers listen to your post.', 'jetpack' ) }</p>
		<p>
			<a href="https://anchor.fm/wordpress" target="_top">
				{ __( 'Create a podcast episode', 'jetpack' ) }
				<Icon icon={ external } className="components-external-link__icon" />
			</a>
		</p>
	</PluginPostPublishPanel>
);

function showPostPublishOutboundLink() {
	registerPlugin( 'post-publish-anchor-outbound-link', {
		render: ConvertToAudio,
	} );
}

function initAnchor() {
	const isExtensionAvailable = getJetpackExtensionAvailability( name )?.available;
	if ( ! isExtensionAvailable ) {
		return;
	}

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

function functionHandler( OriginalBlockEdit ) {
	return ( props ) => {
		const { name: blockName } = useBlockEditContext();

		if ( blockName !== 'core/paragraph' ) {
			return (
				<OriginalBlockEdit { ...props } />
			);
		}

		return (
			<>
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							icon="microphone"
							onClick={ console.log }
						/>
					</ToolbarGroup>
				</BlockControls>
				<OriginalBlockEdit { ...props } />
			</>
		);
	};
}

addFilter(
	'editor.BlockEdit',
	'jetpack/anchor-fm',
	functionHandler
);