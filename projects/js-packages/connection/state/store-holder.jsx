/**
 * External dependencies
 */
import { createReduxStore, register, dispatch } from '@wordpress/data';

class storeHolder {
	static store = null;

	static mayBeInit( storeId, storeConfig ) {
		if ( null === storeHolder.store ) {
			storeHolder.store = createReduxStore( storeId, storeConfig );
			register( storeHolder.store );
		}
	}
}

export default storeHolder;
