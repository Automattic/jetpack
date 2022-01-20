/**
 * External dependencies
 */
import { registerStore } from '@wordpress/data';
import applyMiddlewares from './middlewares';

/**
 * Internal dependencies
 */
import effects from './effects';
class storeHolder {
	static store = null;

	static mayBeInit( storeId, storeConfig ) {
		if ( null === storeHolder.store ) {
			// Register `my-jetpack` store.
			const store = registerStore( storeId, storeConfig );

			// Apply side effects to the store.
			const storeWithEffects = applyMiddlewares( store, effects );

			storeHolder.store = storeWithEffects;
		}
	}
}

export default storeHolder;
