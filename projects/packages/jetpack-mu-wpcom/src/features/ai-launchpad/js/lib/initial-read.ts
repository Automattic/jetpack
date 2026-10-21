const reads = new Map< string, Promise< unknown > >();

/**
 * Share one request between callers in the same tick, such as StrictMode's doubled effect.
 *
 * The read has a server-side effect (it may claim the auto-tailoring run), so a dropped duplicate
 * could win the claim. The entry is forgotten right after, so a later mount reads fresh data.
 *
 * @param key   - Identifies the request.
 * @param start - Starts the request.
 * @return The shared promise.
 */
export function readOnce< T >( key: string, start: () => Promise< T > ): Promise< T > {
	const existing = reads.get( key );
	if ( existing ) {
		return existing as Promise< T >;
	}
	const read = start();
	reads.set( key, read );
	setTimeout( () => reads.delete( key ), 0 );
	return read;
}
