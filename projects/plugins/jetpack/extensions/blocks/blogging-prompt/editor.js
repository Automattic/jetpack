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
	const { editPost } = dispatch( 'core/editor' );

	const bloggingPromptBlocks = [
		createBlock( 'jetpack/blogging-prompt', { promptFetched: false, promptId, tagsAdded: true } ),
		createBlock( 'core/paragraph' ),
	];

	// Insert blocks and ensure they persist
	insertBlocks( bloggingPromptBlocks, 0, undefined, false );

	// Force a save to ensure blocks persist
	editPost( { blocks: select( 'core/block-editor' ).getBlocks() } );

	// Check if blocks were actually inserted
	const insertedBlocks = select( 'core/block-editor' ).getBlocks();

	// If blocks disappeared, try one more time with a delay
	if ( ! insertedBlocks.some( block => block.name === 'jetpack/blogging-prompt' ) ) {
		await new Promise( resolve => setTimeout( resolve, 100 ) );
		insertBlocks( bloggingPromptBlocks, 0, undefined, false );
		editPost( { blocks: select( 'core/block-editor' ).getBlocks() } );
	}
}

async function initBloggingPrompt() {
	const url = new URL( document.location.href );
	const isNewPost = url.pathname.endsWith( '/wp-admin/post-new.php' );

	if ( ! isNewPost ) {
		return;
	}

	const answerPrompt = url.searchParams.get( 'answer_prompt' ) ?? '0';
	const answerPromptId = parseInt( answerPrompt );

	if ( answerPromptId ) {
		const isEditorReady = select( 'core/editor' ).__unstableIsEditorReady;

		if ( isEditorReady && isEditorReady() === false ) {
			await waitForEditor();
		}

		await insertTemplate( answerPromptId );
	}
}

// Initialize when the DOM is ready
domReady( () => {
	initBloggingPrompt();
} );
