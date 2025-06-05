import { AnyD3Scale, ScaleInput } from '@visx/scale';
import type { ItemTransformer, LabelFormatter } from '@visx/legend/lib/types';

export type ValueOrIdentity< T > = T | { value?: T };

/**
 * Returns an object's value if defined, or the object.
 * @param _ - The object to return the value of.
 * @return The value of the object, or the object itself.
 */
export function valueOrIdentity< T >( _: ValueOrIdentity< T > ): T {
	if ( _ && typeof _ === 'object' && 'value' in _ && typeof _.value !== 'undefined' )
		return _.value;
	return _ as T;
}

/**
 * Returns an object's value if defined, or the object, coerced to a string.
 * @param _ - The object to return the value of.
 * @return The value of the object, or the object itself.
 */
export function valueOrIdentityString< T >( _: ValueOrIdentity< T > ): string {
	return String( valueOrIdentity( _ ) );
}

/**
 * Returns a function which takes a Datum and index as input, and returns a formatted label object.
 * @param {object}                            root0             - The object to return the value of.
 * @param {AnyD3Scale}                        root0.scale       - The scale to use.
 * @param {LabelFormatter<ScaleInput<Scale>>} root0.labelFormat - The label format to use.
 * @return {ItemTransformer<ScaleInput<Scale>, ReturnType<Scale>>} The label transform factory.
 */
export function labelTransformFactory< Scale extends AnyD3Scale >( {
	scale,
	labelFormat,
}: {
	scale: Scale;
	labelFormat: LabelFormatter< ScaleInput< Scale > >;
} ): ItemTransformer< ScaleInput< Scale >, ReturnType< Scale > > {
	return ( d, i ) => ( {
		datum: d,
		index: i,
		text: `${ labelFormat( d, i ) }`,
		value: scale( d ),
	} );
}
