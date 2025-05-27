import { select, subscribe } from '@wordpress/data';

/**
 * Checks if the editor is ready by verifying if it's a clean new post or has blocks.
 *
 * @return {boolean} Whether the editor is ready.
 */
const isEditorReady = () => {
	return (
		select( 'core/editor' ).isCleanNewPost() || select( 'core/block-editor' ).getBlocks().length > 0
	);
};

/**
 * Indicates if the block editor has been initialized.
 *
 * @return {Promise} Promise that resolves when the editor has been initialized.
 */
export const waitForEditor = async () =>
	new Promise( resolve => {
		// Resolve immediately if editor is ready
		if ( isEditorReady() ) {
			resolve();
			return;
		}

		// Otherwise wait for blocks to appear
		const timeoutId = setTimeout( () => {
			unsubscribe();
			resolve();
		}, 2000 );

		const unsubscribe = subscribe( () => {
			if ( isEditorReady() ) {
				clearTimeout( timeoutId );
				unsubscribe();
				resolve();
			}
		} );
	} );
