import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { castArray } from 'lodash';
import '@wordpress/notices';
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
