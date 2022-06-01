import { createReduxStore, registerStore, register } from '@wordpress/data';
import { STORE_ID } from './constants';
import storeDefinition from './store-definition';

// Register the store, considering the API changes.
if ( typeof createReduxStore !== 'undefined' ) {
	const store = createReduxStore( STORE_ID, storeDefinition );
	register( store );
} else {
	registerStore( STORE_ID, storeDefinition );
}
