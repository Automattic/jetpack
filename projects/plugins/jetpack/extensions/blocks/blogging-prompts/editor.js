import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { waitForEditor } from '../../shared/wait-for-editor';

async function insertTemplate( prompt, embedPrompt = false ) {
	await waitForEditor();

	const { insertBlocks } = dispatch( 'core/block-editor' );
	const writingPromptBlocks = embedPrompt
		? [ createBlock( 'core/pullquote', { value: prompt.text } ), createBlock( 'core/paragraph' ) ]
		: createBlock( 'core/paragraph', { placeholder: prompt.text }, [] );

	insertBlocks( writingPromptBlocks, 0, undefined, false );
}

function initBloggingPrompts() {
	const data = window.Jetpack_BloggingPrompts;
	const urlQuery = new URLSearchParams( document.location.search );
	const embedPrompt = !! urlQuery.get( 'embed_prompt' );
	if ( typeof data !== 'object' || ! data.prompts || ! data.prompts[ 0 ] ) {
		return;
	}

	insertTemplate( data.prompts[ 0 ], embedPrompt );
}

initBloggingPrompts();
