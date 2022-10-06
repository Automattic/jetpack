import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import { waitForEditor } from '../../shared/wait-for-editor';

async function insertTemplate( prompt ) {
	await waitForEditor();

	const { insertBlock } = dispatch( 'core/block-editor' );
	const writingPromptBlock = createBlock( 'core/paragraph', { placeholder: prompt }, [] );

	insertBlock( writingPromptBlock, 0, undefined, false );
}

function initWritingPrompts() {
	const data = window.Jetpack_WritingPrompts;

	if ( typeof data !== 'object' || ! data.prompt ) {
		return;
	}

	insertTemplate( data.prompt );
}

initWritingPrompts();
