import { JetpackLogo } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { dispatch } from '@wordpress/data';
import { PluginPostPublishPanel } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { external, Icon } from '@wordpress/icons';
import { registerPlugin } from '@wordpress/plugins';
import { castArray } from 'lodash';
import { useEffect, useCallback } from 'react';
import '@wordpress/notices';
import analytics from '../../../_inc/client/lib/analytics';
import { waitForEditor } from '../../shared/wait-for-editor';
import { basicTemplate, spotifyBadgeTemplate } from './templates';
import './editor.scss';

async function insertTemplate( params ) {
	await waitForEditor();

	const { insertBlocks } = dispatch( 'core/block-editor' );

	let templateBlocks;

	switch ( params.tpl ) {
		case 'spotifyBadge':
			templateBlocks = spotifyBadgeTemplate( params );
			break;

		case 'basicEpisode':
			templateBlocks = basicTemplate( params );
			break;
	}

	if ( templateBlocks?.length ) {
		insertBlocks( templateBlocks, 0, undefined, false );
	}
}

async function setEpisodeTitle( { title } ) {
	if ( ! title ) {
		return;
	}
	await waitForEditor();
	dispatch( 'core/editor' ).editPost( { title } );
}

const ConvertToAudio = () => {
	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_editor_block_anchor_fm_post_publish_impression' );
	}, [] );
	const handleClick = useCallback(
		() => analytics.tracks.recordEvent( 'jetpack_editor_block_anchor_fm_post_publish_click' ),
		[]
	);
	return (
		<PluginPostPublishPanel
			className="anchor-post-publish-outbound-link"
			icon={ <JetpackLogo showText={ false } height={ 16 } logoColor="#1E1E1E" /> }
		>
			<p className="post-publish-panel__postpublish-subheader">
				<strong>{ __( 'Convert to audio', 'jetpack' ) }</strong>
			</p>
			<p>
				{ __(
					'Seamlessly turn this post into a podcast episode with Anchor - and let readers listen to your post.',
					'jetpack'
				) }
			</p>
			<div
				role="link"
				className="post-publish-panel__postpublish-buttons"
				tabIndex={ 0 }
				onClick={ handleClick }
				onKeyDown={ handleClick }
			>
				<Button variant="secondary" href="https://anchor.fm/wordpressdotcom" target="_top">
					{ __( 'Create a podcast episode', 'jetpack' ) }{ ' ' }
					<Icon icon={ external } className="anchor-post-publish-outbound-link__external_icon" />
				</Button>
			</div>
		</PluginPostPublishPanel>
	);
};

function showPostPublishOutboundLink() {
	registerPlugin( 'anchor-post-publish-outbound-link', {
		render: ConvertToAudio,
	} );
}

function createEpisodeErrorNotice( params ) {
	dispatch( 'core/notices' ).createNotice(
		'error',
		__(
			"We couldn't find that episode in your feed. If you just published the episode, please try creating the post again in a few minutes.",
			'jetpack'
		),
		{
			id: 'episode-error-notice',
			actions: [
				{
					onClick() {
						window.location.href = params.retry_url;
					},
					onKeyDown() {
						window.location.href = params.retry_url;
					},
					label: __( 'Retry', 'jetpack' ),
				},
			],
		}
	);
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
				insertTemplate( { ...actionParams, tpl: 'spotifyBadge' } );
				break;
			case 'insert-episode-template':
				insertTemplate( { ...actionParams, tpl: 'basicEpisode' } );
				break;
			case 'show-post-publish-outbound-link':
				showPostPublishOutboundLink();
				break;
			case 'set-episode-title':
				setEpisodeTitle( actionParams );
				break;
			case 'create-episode-error-notice':
				createEpisodeErrorNotice( actionParams );
				break;
		}
	} );
}

initAnchor();
