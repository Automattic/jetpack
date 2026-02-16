import { select, subscribe } from '@wordpress/data';

/**
 * Maximum time to wait for the block editor to initialize, in milliseconds.
 *
 * The editor is normally ready within few seconds. If initialization takes longer than
 * this timeout will reject with an error to avoid waiting indefinitely.
 */
const EDITOR_READY_TIMEOUT: number = 7000;

/**
 * Waits for the block editor to be initialized.
 *
 * @return Promise that resolves when the editor is initialized.
 */
export function waitForEditor(): Promise< void > {
	return new Promise( ( resolve, reject ) => {
		if ( isEditorReady() ) {
			resolve();
			return;
		}

		/** Checks periodically if the editor is ready and resolves the promise when it is. */
		const unsubscribe = subscribe( (): void => {
			if ( isEditorReady() ) {
				clearTimeout( timeout );
				unsubscribe();
				resolve();
			}
		} );

		/** Sets a timeout to reject the promise if the editor is not ready within the specified time. */
		const timeout = setTimeout( (): void => {
			unsubscribe();
			reject( new Error( 'Timeout: Waiting for the editor to be ready has timed out.' ) );
		}, EDITOR_READY_TIMEOUT );
	} );
}

/**
 * Checks if the block editor has been initialized.
 *
 * @return True if the block editor has been initialized.
 */
function isEditorReady(): boolean {
	const editorStore = select( 'core/editor' );
	const blockEditorStore = select( 'core/block-editor' );

	if ( ! editorStore || ! blockEditorStore ) {
		return false;
	}

	return (
		editorStore.isCleanNewPost() ||
		editorStore.getCurrentPostId() ||
		blockEditorStore.getBlocks().length > 0
	);
}
