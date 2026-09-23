import { relativeLuminance, validateHexColor } from '../../../utils';

export type Lab = readonly [ number, number, number ];

/** A color as seen in normal vision, then under deuteranopia and protanopia. */
export type ColorViews = readonly [ Lab, Lab, Lab ];

type Matrix = readonly number[];

// Machado, Oliveira and Fernandes (2009), severity 1.0, on linear sRGB.
const DEUTERANOPIA: Matrix = [
	0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881,
];
const PROTANOPIA: Matrix = [
	0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998,
];

const DEGREES = Math.PI / 180;

const toLinear = ( channel: number ): number =>
	channel <= 0.04045 ? channel / 12.92 : Math.pow( ( channel + 0.055 ) / 1.055, 2.4 );

const fromLinear = ( channel: number ): number =>
	channel <= 0.0031308 ? 12.92 * channel : 1.055 * Math.pow( channel, 1 / 2.4 ) - 0.055;

const hexToLinear = ( hex: string ): number[] => {
	validateHexColor( hex );
	return [ 1, 3, 5 ].map( start =>
		toLinear( parseInt( hex.slice( start, start + 2 ), 16 ) / 255 )
	);
};

const linearToHex = ( linear: number[] ): string =>
	'#' +
	linear
		.map( channel =>
			Math.round( Math.min( 1, Math.max( 0, fromLinear( channel ) ) ) * 255 )
				.toString( 16 )
				.padStart( 2, '0' )
		)
		.join( '' );

const simulate = ( matrix: Matrix, [ r, g, b ]: number[] ): number[] =>
	[ 0, 3, 6 ].map( row =>
		Math.min( 1, Math.max( 0, matrix[ row ] * r + matrix[ row + 1 ] * g + matrix[ row + 2 ] * b ) )
	);

const linearToLab = ( [ r, g, b ]: number[] ): Lab => {
	const x = ( 0.4124564 * r + 0.3575761 * g + 0.1804375 * b ) / 0.95047;
	const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
	const z = ( 0.0193339 * r + 0.119192 * g + 0.9503041 * b ) / 1.08883;
	const f = ( t: number ): number =>
		t > 216 / 24389 ? Math.cbrt( t ) : ( ( 24389 / 27 ) * t + 16 ) / 116;
	return [ 116 * f( y ) - 16, 500 * ( f( x ) - f( y ) ), 200 * ( f( y ) - f( z ) ) ];
};

/**
 * CIEDE2000 color difference between two CIELAB colors.
 *
 * @param first  - First color in CIELAB.
 * @param second - Second color in CIELAB.
 * @return ΔE00; about 10 is where two chart categories stop being reliably distinguishable.
 */
export const deltaE2000 = ( first: Lab, second: Lab ): number => {
	const [ l1, a1, b1 ] = first;
	const [ l2, a2, b2 ] = second;
	const chromaMean = ( Math.hypot( a1, b1 ) + Math.hypot( a2, b2 ) ) / 2;
	const g = 0.5 * ( 1 - Math.sqrt( chromaMean ** 7 / ( chromaMean ** 7 + 25 ** 7 ) ) );
	const a1p = a1 * ( 1 + g );
	const a2p = a2 * ( 1 + g );
	const c1p = Math.hypot( a1p, b1 );
	const c2p = Math.hypot( a2p, b2 );
	const hueOf = ( a: number, b: number ): number =>
		a === 0 && b === 0 ? 0 : ( Math.atan2( b, a ) / DEGREES + 360 ) % 360;
	const h1p = hueOf( a1p, b1 );
	const h2p = hueOf( a2p, b2 );
	const chromatic = c1p * c2p !== 0;

	let hueDelta = chromatic ? h2p - h1p : 0;
	if ( hueDelta > 180 ) {
		hueDelta -= 360;
	} else if ( hueDelta < -180 ) {
		hueDelta += 360;
	}

	const lightnessDelta = l2 - l1;
	const chromaDelta = c2p - c1p;
	const hueDifference = 2 * Math.sqrt( c1p * c2p ) * Math.sin( ( hueDelta * DEGREES ) / 2 );
	const lightnessMean = ( l1 + l2 ) / 2;
	const chromaMeanPrime = ( c1p + c2p ) / 2;

	let hueMean = h1p + h2p;
	if ( chromatic ) {
		if ( Math.abs( h1p - h2p ) > 180 ) {
			hueMean += hueMean < 360 ? 360 : -360;
		}
		hueMean /= 2;
	}

	const t =
		1 -
		0.17 * Math.cos( ( hueMean - 30 ) * DEGREES ) +
		0.24 * Math.cos( 2 * hueMean * DEGREES ) +
		0.32 * Math.cos( ( 3 * hueMean + 6 ) * DEGREES ) -
		0.2 * Math.cos( ( 4 * hueMean - 63 ) * DEGREES );
	const lightnessScale =
		1 + ( 0.015 * ( lightnessMean - 50 ) ** 2 ) / Math.sqrt( 20 + ( lightnessMean - 50 ) ** 2 );
	const chromaScale = 1 + 0.045 * chromaMeanPrime;
	const hueScale = 1 + 0.015 * chromaMeanPrime * t;
	const rotation =
		-2 *
		Math.sqrt( chromaMeanPrime ** 7 / ( chromaMeanPrime ** 7 + 25 ** 7 ) ) *
		Math.sin( 60 * Math.exp( -( ( ( hueMean - 275 ) / 25 ) ** 2 ) ) * DEGREES );

	const lightnessTerm = lightnessDelta / lightnessScale;
	const chromaTerm = chromaDelta / chromaScale;
	const hueTerm = hueDifference / hueScale;

	return Math.sqrt(
		lightnessTerm ** 2 + chromaTerm ** 2 + hueTerm ** 2 + rotation * chromaTerm * hueTerm
	);
};

/**
 * A hex color in CIELAB as seen in normal vision, under deuteranopia and under protanopia.
 *
 * @param  hex - Six-digit hex color.
 * @return The three views.
 * @throws {Error} if hex string is malformed
 */
export const hexToViews = ( hex: string ): ColorViews => {
	const linear = hexToLinear( hex );
	return [
		linearToLab( linear ),
		linearToLab( simulate( DEUTERANOPIA, linear ) ),
		linearToLab( simulate( PROTANOPIA, linear ) ),
	];
};

/**
 * The smallest ΔE00 between two colors across the three views.
 *
 * @param first  - First color's views.
 * @param second - Second color's views.
 * @return The distance in the view where the two are hardest to tell apart.
 */
export const viewDistance = ( first: ColorViews, second: ColorViews ): number =>
	Math.min(
		deltaE2000( first[ 0 ], second[ 0 ] ),
		deltaE2000( first[ 1 ], second[ 1 ] ),
		deltaE2000( first[ 2 ], second[ 2 ] )
	);

/**
 * Convert an OKLCH color to sRGB hex.
 *
 * @param lightness - OKLab L, 0 to 1.
 * @param chroma    - OKLCH C.
 * @param hue       - Hue in degrees.
 * @return Hex color, or null when the color is outside the sRGB gamut.
 */
export const oklchToHex = ( lightness: number, chroma: number, hue: number ): string | null => {
	const a = chroma * Math.cos( hue * DEGREES );
	const b = chroma * Math.sin( hue * DEGREES );
	const l = ( lightness + 0.3963377774 * a + 0.2158037573 * b ) ** 3;
	const m = ( lightness - 0.1055613458 * a - 0.0638541728 * b ) ** 3;
	const s = ( lightness - 0.0894841775 * a - 1.291485548 * b ) ** 3;
	const linear = [
		4.0767416621 * l - 3.3077633306 * m + 0.2309645873 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	];
	const tolerance = 1e-4;
	if ( linear.some( channel => channel < -tolerance || channel > 1 + tolerance ) ) {
		return null;
	}
	return linearToHex( linear );
};

/**
 * WCAG contrast ratio between two hex colors.
 *
 * @param  first  - First hex color.
 * @param  second - Second hex color.
 * @return Ratio from 1 to 21.
 * @throws {Error} if either hex string is malformed
 */
export const contrastRatio = ( first: string, second: string ): number => {
	const [ lighter, darker ] = [ relativeLuminance( first ), relativeLuminance( second ) ].sort(
		( x, y ) => y - x
	);
	return ( lighter + 0.05 ) / ( darker + 0.05 );
};
