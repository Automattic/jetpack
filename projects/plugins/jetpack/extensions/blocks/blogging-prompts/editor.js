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
	const data = window.Jetpack_BloggingPrompts;
	if ( ! data || ! data.prompt ) {
		return;
	}

	insertTemplate( data.prompt );
}

initBloggingPrompts();
