/**
 * Handy helper method to run map on an Object's values. Similar to Array.map,
 * but for objects.
 *
 * Usually tempalted InValueType and OutValueType can be auto-detected by
 * TypeScript, and don't need to be explicitly specified.
 *
 * @template InValueType Type of input object values.
 * @template OutValueType Type of output object values.
 *
 * @param { Object } obj - Object to map.
 * @param { Function } callback - Callback to run on each object value.
 */
export function objectMap< OutValueType, InValueType >(
	obj: { [ name: string ]: InValueType },
	callback: ( value: InValueType, key?: string ) => OutValueType
): { [ name: string ]: OutValueType } {
	return Object.keys( obj ).reduce( ( set, key ) => {
		set[ key ] = callback( obj[ key ], key );
		return set;
	}, {} as { [ name: string ]: OutValueType } );
}
