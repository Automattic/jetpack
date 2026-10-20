// WCAG's minimum for large text and for the box's border, both drawn in the inherited colour.
const MIN_CONTRAST = 3;
const DARK = '#1e1e1e';
const LIGHT = '#fff';

/**
 * The first background painted behind an element.
 *
 * @param element - The element.
 * @return The computed colour, or an empty string when nothing paints one.
 */
export const backgroundBehind = ( element: HTMLElement ) => {
	for ( let node = element.parentElement; node; node = node.parentElement ) {
		const { backgroundColor } = getComputedStyle( node );
		if ( backgroundColor !== 'rgba(0, 0, 0, 0)' && backgroundColor !== 'transparent' ) {
			return backgroundColor;
		}
	}
	return '';
};

// Only `rgb()` and `rgba()`, which is how browsers compute every sRGB colour.
const parse = ( color: string ) => {
	const match = color.match( /^rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)$/ );
	return match
		? { rgb: match.slice( 1, 4 ).map( Number ), alpha: Number( match[ 4 ] ?? 1 ) }
		: null;
};

const luminance = ( rgb: number[] ) => {
	const [ r, g, b ] = rgb.map( value => {
		const channel = value / 255;
		return channel <= 0.04045 ? channel / 12.92 : ( ( channel + 0.055 ) / 1.055 ) ** 2.4;
	} );
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = ( a: number, b: number ) =>
	( Math.max( a, b ) + 0.05 ) / ( Math.min( a, b ) + 0.05 );

/**
 * Give the box a readable colour when the one it inherits vanishes into the background
 * behind it, as when a theme paints the reply area white under a dark palette's light text.
 *
 * @param element - The box's mount.
 */
export const ensureContrast = ( element: HTMLElement ) => {
	const text = parse( getComputedStyle( element ).color );
	const background = parse( backgroundBehind( element ) );
	// A translucent background mixes with whatever is under it, so its shade is unknown.
	if ( ! text || ! background || background.alpha < 1 ) {
		return;
	}

	const behind = luminance( background.rgb );
	if ( contrast( luminance( text.rgb ), behind ) >= MIN_CONTRAST ) {
		return;
	}

	// Black on white is 21:1, so one of the two always clears the bar.
	element.style.color = contrast( behind, 0 ) >= contrast( behind, 1 ) ? DARK : LIGHT;
	element.classList.add( 'has-own-color' );
};
