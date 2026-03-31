import { createReduxStore, register, select } from '@wordpress/data';

class storeHolder {
	static store = null;

	static mayBeInit( storeId, storeConfig ) {
		if ( null === storeHolder.store ) {
			storeHolder.store = createReduxStore( storeId, storeConfig );
			// Guard against duplicate registration when multiple bundles include this package.
			// Note: select() returns undefined (not throws) for unregistered stores.
			if ( ! select( storeId ) ) {
				register( storeHolder.store );
			}
		}
	}
}

export default storeHolder;
