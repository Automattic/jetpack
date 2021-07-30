/**
 * Handy helper method to run filter on an Object. Similar to Array.filter,
 * but for objects.
 *
 * Usually templated ValueType can be auto-detected by TypeScript and won't
 * need to be specified.
 *
 * @template ValueType Type of object values.
 *
 * @param { Object } obj - Object to map.
 * @param { Function } predicate - Callback to run on each object value.
 */
export function objectFilter< ValueType >(
	obj: { [ name: string ]: ValueType },
	predicate: ( value: ValueType, key?: string ) => boolean
): { [ name: string ]: ValueType } {
	return Object.entries( obj ).reduce( ( filtered, [ key, value ] ) => {
		if ( predicate( value, key ) ) {
			filtered[ key ] = value;
		}

		return filtered;
	}, {} as { [ name: string ]: ValueType } );
}
