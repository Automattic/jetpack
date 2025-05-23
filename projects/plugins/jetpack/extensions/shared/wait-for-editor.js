import { select, subscribe } from '@wordpress/data';

/**
 * Indicates if the block editor has been initialized.
 *
 * @return {Promise} Promise that resolves when the editor has been initialized.
 */
export const waitForEditor = async () =>
	new Promise( resolve => {
		console.log( '[Wait For Editor] Function called - checking for race condition' );

		const isReady = () => {
			const isCleanNewPost = select( 'core/editor' ).isCleanNewPost();
			const blocks = select( 'core/block-editor' ).getBlocks();
			const ready = isCleanNewPost || blocks.length > 0;

			console.log( '[Wait For Editor] Ready state check:', {
				isCleanNewPost,
				blocksLength: blocks.length,
				ready,
				timestamp: Date.now(),
			} );

			return ready;
		};

		// Check if editor is already ready before subscribing
		if ( isReady() ) {
			console.log( '[Wait For Editor] Race condition detected - editor already ready' );
			resolve();
			return;
		}

		console.log( '[Wait For Editor] Editor not ready - setting up subscription' );
		const unsubscribe = subscribe( () => {
			if ( isReady() ) {
				console.log( '[Wait For Editor] Editor became ready via subscription' );
				unsubscribe();
				resolve();
			}
		} );
	} );
