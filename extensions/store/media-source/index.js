/**
 * WordPress dependencies
 */
import { createReduxStore, registerStore, register } from '@wordpress/data';
/**
 * Internal dependencies
 */
import storeDefinition from './storeDefinition';
import { STORE_ID } from './constants';

// Register the store, considering the API changes.
if ( typeof createReduxStore !== 'undefined' ) {
	const store = createReduxStore( STORE_ID, storeDefinition );
	register( store );
} else {
	registerStore( STORE_ID, storeDefinition );
}
