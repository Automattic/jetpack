import { select, subscribe } from '@wordpress/data';

/**
 * Indicates if the block editor has been initialized.
 *
 * @return {Promise} Promise that resolves when the editor has been initialized.
 */
export const waitForEditor = async () =>
	new Promise( resolve => {
		// Resolve immediately if it's a clean new post or has blocks
		if (
			select( 'core/editor' ).isCleanNewPost() ||
			select( 'core/block-editor' ).getBlocks().length > 0
		) {
			resolve();
			return;
		}

		// Otherwise wait for blocks to appear
		const timeoutId = setTimeout( () => {
			unsubscribe();
			resolve();
		}, 2000 );

		const unsubscribe = subscribe( () => {
			const blocks = select( 'core/block-editor' ).getBlocks();
			if ( blocks.length > 0 ) {
				clearTimeout( timeoutId );
				unsubscribe();
				resolve();
			}
		} );
	} );
