import { select, subscribe } from '@wordpress/data';

/**
 * Waits for the block editor to be initialized.
 *
 * @return Promise that resolves when the editor is initialized.
 */
export const waitForEditor = (): Promise< void > =>
	new Promise( resolve => {
		if ( isEditorReady() ) {
			resolve();
			return;
		}

		const unsubscribe = subscribe( (): void => {
			if ( isEditorReady() ) {
				unsubscribe();
				resolve();
			}
		} );
	} );

/**
 * Checks if the block editor has been initialized.
 *
 * @return {boolean} True if the block editor has been initialized.
 */
function isEditorReady(): boolean {
	const editorStore = select( 'core/editor' );
	const blockEditorStore = select( 'core/block-editor' );

	return (
		editorStore.isCleanNewPost() ||
		blockEditorStore.getBlocks().length > 0 ||
		editorStore.getCurrentPostId()
	);
}
