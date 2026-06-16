import type { ItemTransformer, LabelFormatter } from '@visx/legend';
import type { AnyD3Scale, ScaleInput } from '@visx/scale';

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
