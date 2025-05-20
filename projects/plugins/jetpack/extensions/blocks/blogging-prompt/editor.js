import { createBlock } from '@wordpress/blocks';
import { dispatch, select } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import { waitForEditor } from '../../shared/wait-for-editor';
import metadata from './block.json';
import edit from './edit';
import avatar1 from './example-avatars/avatar1.jpg';
import avatar2 from './example-avatars/avatar2.jpg';
import avatar3 from './example-avatars/avatar3.jpg';
import save from './save';

import './editor.scss';
import './style.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save,
	example: {
		attributes: {
			answersLink: 'https://wordpress.com/tag/dailyprompt',
			answersLinkText: __( 'View all responses', 'jetpack' ),
			gravatars: [ { url: avatar1 }, { url: avatar2 }, { url: avatar3 } ],
			promptLabel: __( 'Daily writing prompt', 'jetpack' ),
			promptText: __( "What's your favorite place to visit?", 'jetpack' ),
			promptFetched: true,
			promptId: 1234,
			showResponses: true,
			showLabel: true,
			tagsAdded: true,
			isBloganuary: false,
		},
	},
} );

async function insertTemplate( promptId ) {
	await waitForEditor();

	const { insertBlocks } = dispatch( 'core/block-editor' );
	const bloggingPromptBlocks = [
		createBlock( 'jetpack/blogging-prompt', { promptFetched: false, promptId, tagsAdded: true } ),
		createBlock( 'core/paragraph' ),
	];
	console.log( 'bloggingPromptBlocks', bloggingPromptBlocks );

	insertBlocks( bloggingPromptBlocks, 0, undefined, false );
}

async function initBloggingPrompt() {
	const url = new URL( document.location.href );

	const isNewPost = url.pathname.endsWith( '/wp-admin/post-new.php' );
	console.log( 'isNewPost', isNewPost );

	if ( ! isNewPost ) {
		return;
	}

	const answerPrompt = url.searchParams.get( 'answer_prompt' ) ?? '0';
	const answerPromptId = parseInt( answerPrompt );
	console.log( 'answerPromptId', answerPromptId );

	if ( answerPromptId ) {
		const isEditorReady = select( 'core/editor' ).__unstableIsEditorReady;
		console.log( 'isEditorReady', isEditorReady );

		if ( isEditorReady && isEditorReady() === false ) {
			console.log( 'isEditorReady is false, waiting for editor' );
			await waitForEditor();
		}

		await insertTemplate( answerPromptId );
	}
}

// Initialize when the DOM is ready
domReady( () => {
	initBloggingPrompt();
} );
