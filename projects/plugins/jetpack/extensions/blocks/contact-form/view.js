import { dispatch, select, subscribe } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';

if ( typeof window !== 'undefined' ) {
	domReady( () => {
		const getBlockList = () => select( 'core/block-editor' ).getBlocks();
		const unsubscribe = subscribe( () => {
			const newBlockList = getBlockList();
			const forms = newBlockList.filter( block => ( block.name = 'jetpack/contact-form' ) );
			if ( forms.length > 0 ) {
				unsubscribe();
				forms.forEach( form => {
					const button = form.innerBlocks.find( block => block.name === 'jetpack/button' );
					if ( button ) {
						const lock = { move: false, remove: true };
						dispatch( 'core/block-editor' ).updateBlockAttributes( button.clientId, {
							lock,
						} );
					}
				} );
			}
		} );
	} );
}
