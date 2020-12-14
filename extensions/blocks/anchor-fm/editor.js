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
import getJetpackExtensionAvailability from '../../shared/get-jetpack-extension-availability';
import { waitForEditor } from '../../shared/wait-for-editor';

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

function overrideWelcomeGuide() {
	addFilter( 'plugins.registerPlugin', 'jetpack/anchor-welcome-guide', ( settings, name ) => {
		// WP.com uses a custom welcome guide provided by a plugin.
		// See https://github.com/Automattic/wp-calypso/blob/2e1fe38b7bdbaf3eb997160f83ff71fd781b3fbe/apps/editing-toolkit/editing-toolkit-plugin/wpcom-block-editor-nux/src/wpcom-nux.js#L173
		if ( name !== 'wpcom-block-editor-nux' ) {
			return settings;
		}

		// TODO: Override welcome guide.
		return settings;
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
			case 'override-welcome-guide':
				overrideWelcomeGuide();
				break;
		}
	} );
}

initAnchor();
