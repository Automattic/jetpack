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
			storeHolder.resolveResolvers( storeId, storeConfig.initialState );
		}
	}

	static resolveResolvers( storeId, initialState ) {
		if (
			initialState.connectionStatus &&
			initialState.connectionStatus.hasOwnProperty( 'isRegistered' )
		) {
			dispatch( storeId ).finishResolution( 'getConnectionStatus', [] );
		}
	}
}

export default storeHolder;
