/**
 * External dependencies
 */
import { castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { addFilter } from '@wordpress/hooks';
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

async function insertSpotifyBadge( { image, url } ) {
	if ( ! image || ! url ) {
		return;
	}

	await waitForEditor();
	dispatch( 'core/block-editor' ).insertBlock(
		createBlock( 'core/image', {
			url: image,
			linkDestination: 'none',
			href: url,
			align: 'center',
			width: 165,
			height: 40,
			className: 'is-spotify-podcast-badge',
		} ),
		0,
		undefined,
		false
	);
}

async function setEpisodeTitle( { title } ) {
	if ( ! title ) {
		return;
	}
	await waitForEditor();
	dispatch( 'core/editor' ).editPost( { title } );
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

	data.actions.forEach( action => {
		const [ actionName, actionParams ] = castArray( action );
		switch ( actionName ) {
			case 'insert-spotify-badge':
				insertSpotifyBadge( actionParams );
				break;
			case 'show-post-publish-outbound-link':
				showPostPublishOutboundLink();
				break;
			case 'set-episode-title':
				setEpisodeTitle( actionParams );
				break;
		}
	} );
}

initAnchor();
