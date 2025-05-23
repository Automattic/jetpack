import { select, subscribe } from '@wordpress/data';
import debugFactory from '@wordpress/debug';

const debug = debugFactory( 'jetpack:wait-for-editor' );

/**
 * Checks if the editor is ready by verifying if it's a clean new post or has blocks.
 *
 * @return {boolean} Whether the editor is ready.
 */
const isEditorReady = () => {
	const isCleanNewPost = select( 'core/editor' ).isCleanNewPost();
	const blocks = select( 'core/block-editor' ).getBlocks();
	const ready = isCleanNewPost || blocks.length > 0;

	debug( 'Editor ready check:', {
		isCleanNewPost,
		blocksLength: blocks.length,
		ready,
	} );

	return ready;
};

/**
 * Indicates if the block editor has been initialized.
 *
 * @return {Promise} Promise that resolves when the editor has been initialized.
 */
export const waitForEditor = async () =>
	new Promise( resolve => {
		debug( 'waitForEditor called' );

		// Check if editor is already ready before subscribing
		if ( isEditorReady() ) {
			debug( 'Editor already ready - resolving immediately' );
			resolve();
			return;
		}

		debug( 'Editor not ready - subscribing to changes' );
		const unsubscribe = subscribe( () => {
			if ( isEditorReady() ) {
				debug( 'Editor became ready - resolving promise' );
				unsubscribe();
				resolve();
			}
		} );
	} );
