import { createBlock } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';
import registerJetpackBlock from '../../shared/register-jetpack-block';
import { waitForEditor } from '../../shared/wait-for-editor';
import { name, settings } from '.';
import './style.scss';

registerJetpackBlock( name, settings );

async function insertTemplate( promptId ) {
	await waitForEditor();

	const { insertBlocks } = dispatch( 'core/block-editor' );
	const bloggingPromptBlocks = [
		createBlock( `jetpack/${ name }`, { promptFetched: false, promptId, tagsAdded: true } ),
		createBlock( 'core/paragraph' ),
	];

	insertBlocks( bloggingPromptBlocks, 0, undefined, false );
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
