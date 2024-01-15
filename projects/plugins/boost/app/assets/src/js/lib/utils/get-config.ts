import { ConfigType } from '$lib/stores/config-ds';

/**
 * A type-safe dot notation string that is valid for a nested keys of an object
 */
type NestedKeyOf< ObjectType extends object > = {
	[ Key in keyof ObjectType & ( string | number ) ]: ObjectType[ Key ] extends object
		? `${ Key }` | `${ Key }.${ NestedKeyOf< ObjectType[ Key ] > }`
		: `${ Key }`;
}[ keyof ObjectType & ( string | number ) ];

/**
 * Infer the type of a nested property of `T` given the path `P` to access it.
 */
type InferType< T, P extends string > = P extends `${ infer K }.${ infer Rest }`
	? K extends keyof T
		? InferType< T[ K ], Rest >
		: never
	: P extends keyof T
	? T[ P ]
	: never;

/**
 * Get Boost config constants from `jetpack_boost_ds`.
 *
 * This is a helper function to get values from jetpack_boost_ds. It works
 * outside of the React context. So, the values loaded during page load will not update.
 * @param {string} path Config to get using the dot notation. Example: getConfig( 'site.url' ).
 */
export const getConfig = < P extends NestedKeyOf< ConfigType > >(
	path: P
): InferType< ConfigType, P > => {
	const win = window as Window &
		typeof globalThis & { jetpack_boost_ds?: { config?: { value: ConfigType } } };
	if ( ! win.jetpack_boost_ds ) {
		throw new Error( 'jetpack_boost_ds is not defined in window' );
	}

	if ( ! win.jetpack_boost_ds.config ) {
		throw new Error( 'The key `config` is not defined in `jetpack_boost_ds` namespace.' );
	}

	const config = win.jetpack_boost_ds.config.value;

	const keys = path.split( '.' );
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let result: any = config;
	for ( const key of keys ) {
		if ( key in result ) {
			result = result[ key ];
		} else {
			return undefined as unknown as InferType< ConfigType, P >;
		}
	}
	return result as InferType< ConfigType, P >;
};
