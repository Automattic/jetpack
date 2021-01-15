/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore, register } from '@wordpress/data';
/**
 * Internal dependencies
 */
import storeDefinition from './storeDefinition';

export const STORE_ID = 'jetpack/media-source';

// Register the store, considering the API changes.
if ( typeof createReduxStore !== 'undefined' ) {
	const store = createReduxStore( STORE_ID, storeDefinition );
	register( store );
} else {
	registerStore( STORE_ID, storeDefinition );
}
