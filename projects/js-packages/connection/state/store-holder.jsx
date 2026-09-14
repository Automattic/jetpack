import { createReduxStore, register, select } from '@wordpress/data';

/**
 * Explains a duplicate registration, which is a build problem rather than a
 * runtime one.
 *
 * `@wordpress/data`'s own message — `Store "x" is already registered.` — says
 * what happened but not why or what to do about it, and the cause is never
 * where the message points: no code registered the store twice. Two scripts
 * each bundled their own copy of this package, and each copy ran its own
 * registration on import.
 *
 * @param {string} storeId - The store that was already registered.
 * @return {string} The message to log.
 */
function duplicateRegistrationMessage( storeId ) {
	return [
		`Jetpack Connection: the "${ storeId }" store was already registered by another script on this page, so this copy was skipped.`,
		'',
		'Nothing is broken — the first registration is used — but two scripts on this page have each bundled their own copy of @automattic/jetpack-connection, so the package ships to visitors more than once.',
		'',
		'The usual cause is a subpath import. The webpack externals map matches the package root only, so:',
		"  import { useConnection } from '@automattic/jetpack-connection';        // shared, loaded once",
		"  import useConnection from '@automattic/jetpack-connection/use-connection'; // bundled into this script",
		'',
		'To fix: import from the package root, then rebuild. If the symbol is not exported there, add it to the package index rather than reaching for the subpath.',
		'See defaultRequestMap in js-packages/webpack-config/src/webpack.js for the mapping.',
	].join( '\n' );
}

class storeHolder {
	static store = null;

	static mayBeInit( storeId, storeConfig ) {
		if ( null !== storeHolder.store ) {
			return;
		}

		/*
		 * This guard is module state, so it only covers this copy of the
		 * package. The registry it protects is global and shared by every
		 * script on the page, so ask the registry rather than trusting the
		 * guard alone.
		 */
		if ( select( storeId ) ) {
			// eslint-disable-next-line no-console
			console.error( duplicateRegistrationMessage( storeId ) );

			/*
			 * Mark this copy as done without registering. `register` would keep
			 * the existing store and log its own, less useful message on top of
			 * this one.
			 */
			storeHolder.store = createReduxStore( storeId, storeConfig );
			return;
		}

		storeHolder.store = createReduxStore( storeId, storeConfig );
		register( storeHolder.store );
	}
}

export default storeHolder;
