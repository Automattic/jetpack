import { select, subscribe } from '@wordpress/data';

/**
 * Indicates if the block editor has been initialized.
 *
 * @returns {Promise} Promise that resolves when the editor has been initialized.
 */
export const waitForEditor = async () =>
	new Promise( resolve => {
		const unsubscribe = subscribe( () => {
			const isCleanNewPost = select( 'core/editor' ).isCleanNewPost();

			if ( isCleanNewPost ) {
				unsubscribe();
				resolve();
			}

			const blocks = select( 'core/editor' ).getBlocks();

			if ( blocks.length > 0 ) {
				unsubscribe();
				resolve();
			}
		} );
	} );
