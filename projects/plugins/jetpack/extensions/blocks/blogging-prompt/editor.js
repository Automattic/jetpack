import { createBlock, getBlockType } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
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

// Register the block and return a promise that resolves when registration is complete
const registerBlock = () =>
	new Promise( resolve => {
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

		// Wait for next tick to ensure registration is complete
		setTimeout( resolve, 0 );
	} );

async function insertTemplate( promptId ) {
	await waitForEditor();

	// Ensure block is registered before insertion
	const blockType = getBlockType( 'jetpack/blogging-prompt' );
	if ( ! blockType ) {
		await registerBlock();
	}

	const { insertBlocks } = dispatch( 'core/block-editor' );

	const bloggingPromptBlock = createBlock( 'jetpack/blogging-prompt', {
		promptFetched: false,
		promptId,
		tagsAdded: true,
	} );

	const paragraphBlock = createBlock( 'core/paragraph' );

	insertBlocks( [ bloggingPromptBlock, paragraphBlock ], 0, undefined, false );
}

function initBloggingPrompt() {
	const url = new URL( document.location.href );
	const isNewPost = url.pathname.endsWith( '/wp-admin/post-new.php' );

	if ( ! isNewPost ) {
		return;
	}

	const answerPrompt = url.searchParams.get( 'answer_prompt' ) ?? '0';
	const answerPromptId = parseInt( answerPrompt );

	if ( answerPromptId ) {
		insertTemplate( answerPromptId );
	}
}

initBloggingPrompt();
