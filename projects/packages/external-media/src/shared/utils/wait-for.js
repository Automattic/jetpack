import { subscribe } from '@wordpress/data';

export const waitFor = async selector =>
	new Promise( resolve => {
		const unsubscribe = subscribe( () => {
			if ( selector() ) {
				unsubscribe();
				resolve();
			}
		} );
	} );
