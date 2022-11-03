import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { waitForEditor } from '../../shared/wait-for-editor';

async function insertTemplate( prompt, embedPrompt = false ) {
	await waitForEditor();

	const { insertBlocks } = dispatch( 'core/block-editor' );
	const bloggingPromptBlocks = embedPrompt
		? [ createBlock( 'core/pullquote', { value: prompt.text } ), createBlock( 'core/paragraph' ) ]
		: createBlock( 'core/paragraph', { placeholder: prompt.text }, [] );

	insertBlocks( bloggingPromptBlocks, 0, undefined, false );
}

function initBloggingPrompts() {
	const prompts = window.Jetpack_BloggingPrompts;
	const urlQuery = new URLSearchParams( document.location.search );
	const answerPrompt = !! urlQuery.get( 'answer_prompt' );
	if ( ! Array.isArray( prompts ) || ! prompts[ 0 ] ) {
		return;
	}

	insertTemplate( prompts[ 0 ], answerPrompt );
}

initBloggingPrompts();
