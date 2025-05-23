import { select, subscribe } from '@wordpress/data';

/**
 * Indicates if the block editor has been initialized.
 *
 * @return {Promise} Promise that resolves when the editor has been initialized.
 */
export const waitForEditor = async () =>
	new Promise( resolve => {
		// If we already have blocks, editor is ready
		if ( select( 'core/block-editor' ).getBlocks().length > 0 ) {
			resolve();
			return;
		}

		// Otherwise wait for either condition
		const timeoutId = setTimeout( () => {
			unsubscribe();
			resolve();
		}, 2000 );

		const unsubscribe = subscribe( () => {
			const isCleanNewPost = select( 'core/editor' ).isCleanNewPost();
			const blocks = select( 'core/block-editor' ).getBlocks();

			if ( isCleanNewPost || blocks.length > 0 ) {
				clearTimeout( timeoutId );
				unsubscribe();
				resolve();
			}
		} );
	} );
