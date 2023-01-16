import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { waitForEditor } from '../../shared/wait-for-editor';

async function insertTemplate( prompt ) {
	await waitForEditor();

	const { insertBlocks } = dispatch( 'core/block-editor' );
	const bloggingPromptBlocks = [
		createBlock( 'core/pullquote', { value: prompt.text } ),
		createBlock( 'core/paragraph' ),
	];

	insertBlocks( bloggingPromptBlocks, 0, undefined, false );
}

function initBloggingPrompts() {
	const prompts = window.Jetpack_BloggingPrompts;
	if ( ! Array.isArray( prompts ) || ! prompts[ 0 ] ) {
		return;
	}

	const urlQuery = new URLSearchParams( document.location.search );
	const answerPrompt = urlQuery.get( 'answer_prompt' ) ?? '0';
	const answerPromptId = parseInt( answerPrompt );

	// Try to find the prompt by id, otherwise just default to the first prompt for today.
	// The current list of prompts starts from yesteday, so today's is the second prompt.
	const prompt = prompts.find( p => p.id === answerPromptId ) ?? prompts[ 1 ];

	if ( prompt ) {
		insertTemplate( prompt );
	}
}

initBloggingPrompts();
