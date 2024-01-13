import { createRoot } from '@wordpress/element';
import { serialize, type BlockInstance } from '@wordpress/blocks';

import { Editor } from './editor';
import { loadTextFormatting } from './load-text-formatting';
import { loadBlocksWithCustomizations } from './load-blocks';
import { addApiMiddleware } from './api';

import './editor-style.scss';

/**
 * Add Gutenberg editor to the page.
 *
 * @param textarea   Textarea element.
 * @param setComment Callback that runs when the editor content changes.
 *                   It receives the serialized content as a parameter.
 */
export const addGutenberg = (
	textarea: HTMLTextAreaElement,
	setComment: ( newValue: string ) => void
) => {
	const editor = document.createElement( 'div' );
	editor.id = 'verbum__block-editor';

	// Insert after the textarea, and hide it
	textarea.after( editor );
	textarea.style.display = 'none';

	loadBlocksWithCustomizations();
	loadTextFormatting();
	addApiMiddleware();

	createRoot( editor ).render(
		<Editor saveContent={ ( content: BlockInstance[] ) => setComment( serialize( content ) ) } />
	);
};
