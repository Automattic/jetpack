/**
 * For detailed information about this file go to the referenced test file.
 *
 * @see extensions/shared/test/execution-lock-test.js
 */

/**
 * Map that relates a locked key with its unique lock value.
 *
 * @type {Map<string, number>}
 */
const lockMap = new Map();

/**
 * Acquires a lock for a given key.
 *
 * @param {string} key - Key for which we will acquire a lock.
 * @returns {null|[string,number]} - After successfully acquiring a lock we return the lock, if the key is locked, null is returned.
 */
const acquire = key => {
	if ( isLocked( key ) ) {
		return null;
	}

	const lockValue = Math.random();
	lockMap.set( key, lockValue );
	return [ key, lockValue ];
};

/**
 * Block the execution until the locked key is released without blocking the thread.
 *
 * @param {string} key - Key that we will wait for release.
 * @param {number} timeOffset - Amount of time to wait between lock checks.
 */
const blockExecution = async ( key, timeOffset = 10 ) => {
	while ( isLocked( key ) ) {
		await new Promise( resolve => setTimeout( resolve, timeOffset ) );
	}
};

/**
 * Clears all the created locks.
 *
 * @returns {void}
 */
const clearAll = () => lockMap.clear();

/**
 * Checks if a lock has been acquired for the given key.
 *
 * @param {string} key - Key to check
 * @returns {boolean} - True if a lock has been acquired for the given key, false otherwise.
 */
const isLocked = key => lockMap.has( key );

/**
 * Releases a given lock.
 *
 * @param {[string,number]} lock - Tuple containing the key and lock value obtained by invoking the acquire method.
 * @returns {boolean} - True if the lock is released, false otherwise.
 */
const release = lock => {
	const [ key, lockedBy ] = lock;
	if ( isLocked( key ) && lockMap.get( key ) === lockedBy ) {
		lockMap.delete( key );
		return true;
	}

	return false;
};

export default {
	acquire,
	blockExecution,
	clearAll,
	isLocked,
	release,
};
