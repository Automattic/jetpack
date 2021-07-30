/**
 * Helper method to convert an object with Promises in each value, to an object
 * full of promise results. Similar to Promise.all, but for objects.
 *
 * @template ValueType - Type of value each promise should return. Usually auto-detected by TypeScript.
 *
 * @param { Object } promises - An object whose values are all promises to be resolved.
 */
export default async function promiseObjectAll< ValueType >( promises: {
	[ key: string ]: Promise< ValueType >;
} ): Promise< { [ key: string ]: ValueType } > {
	// Convert the object into an array of Promises for [ key, value ] pairs.
	const pairs = Object.entries( promises ).map<
		Promise< [ string, ValueType ] >
	>( async ( [ key, value ] ) => [ key, await value ] );

	// Wait for all the promises to finish, and bake it back into an object.
	return ( await Promise.all( pairs ) ).reduce( ( set, [ key, value ] ) => {
		set[ key ] = value;
		return set;
	}, {} as { [ key: string ]: ValueType } );
}
