/**
 * Given an object full of promises, resolves all of them and returns an object containing resultant values.
 * Roughly equivalent of Promise.all, but applies to an object.
 *
 * @param { Object } object - containing promises to resolve
 * @return { Object } - Promise which resolves to an object containing resultant values
 */
export async function objectPromiseAll< ValueType >( object: {
	[ key: string ]: Promise< ValueType >;
} ): Promise< { [ key: string ]: ValueType } > {
	const keys = Object.keys( object );
	const values = await Promise.all( keys.map( key => object[ key ] ) );

	return keys.reduce(
		( acc, key, index ) => {
			acc[ key ] = values[ index ];
			return acc;
		},
		{} as { [ key: string ]: ValueType }
	);
}
