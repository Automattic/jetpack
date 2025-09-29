/**
 * Internal dependencies
 */
import { type AspectRatio } from './types';

/**
 * Converts a preset ratio to a number.
 * @param {AspectRatio} ratio - The preset ratio to convert.
 * @return The aspect ratio object.
 */
export function presetRatioAsNumber( { ratio, ...rest }: AspectRatio ): AspectRatio {
	return {
		ratio: ratioToNumber( ratio ),
		...rest,
	};
}

/**
 * Converts a string aspect ratio to a number.
 * @param {string|number} value - The string aspect ratio to convert.
 * @return The aspect ratio number.
 */
export function ratioToNumber( value: string | number ): number {
	if ( typeof value === 'number' ) {
		return value;
	}

	if ( typeof value !== 'string' ) {
		return value;
	}

	// TODO: support two-value aspect ratio?
	// https://css-tricks.com/almanac/properties/a/aspect-ratio/#aa-it-can-take-two-values
	const [ a, b, ...rest ] = value.split( '/' ).map( Number );
	if ( a <= 0 || b <= 0 || Number.isNaN( a ) || Number.isNaN( b ) || rest.length ) {
		return NaN;
	}
	return b ? a / b : a;
}
