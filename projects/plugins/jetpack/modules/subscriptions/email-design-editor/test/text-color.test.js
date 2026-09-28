import { contrastRatio, deriveTextColor, parseColor, MINIMUM_CONTRAST } from '../src/text-color';
import fixture from './data/text-color-derivation.json';

describe( 'contrastRatio', () => {
	// #767676 is the lightest gray that passes AA on white and #777777 the darkest that fails,
	// which pins the luminance curve at the threshold.
	it.each( [
		[ 'black on white', '#000000', '#ffffff', 21.0 ],
		[ 'white on white', '#ffffff', '#ffffff', 1.0 ],
		[ 'lightest passing AA', '#767676', '#ffffff', 4.54 ],
		[ 'darkest failing AA', '#777777', '#ffffff', 4.48 ],
		[ 'wpcom blue on black', '#113af5', '#000000', 2.95 ],
	] )( 'matches WCAG for %s', ( _name, first, second, expected ) => {
		expect( Number( contrastRatio( first, second ).toFixed( 2 ) ) ).toBe( expected );
		expect( Number( contrastRatio( second, first ).toFixed( 2 ) ) ).toBe( expected );
	} );

	it( 'is null when a color cannot be read', () => {
		expect( contrastRatio( 'red', '#ffffff' ) ).toBeNull();
		expect( contrastRatio( '#ffffff', 'rgba(0, 0, 0, 0.5)' ) ).toBeNull();
	} );
} );

describe( 'parseColor', () => {
	it.each( [
		[ '#abc', [ 170, 187, 204 ] ],
		[ ' #ABCDEF ', [ 171, 205, 239 ] ],
		[ '#abcf', [ 170, 187, 204 ] ],
		[ '#aabbccff', [ 170, 187, 204 ] ],
		[ 'rgb(255, 0, 0)', [ 255, 0, 0 ] ],
		[ 'rgb(255 0 0)', [ 255, 0, 0 ] ],
		[ 'rgb(100%, 50%, 0%)', [ 255, 128, 0 ] ],
		[ 'rgba(0, 0, 0, 1)', [ 0, 0, 0 ] ],
		[ 'rgb(0 0 0 / 100%)', [ 0, 0, 0 ] ],
		[ 'hsl(0, 100%, 50%)', [ 255, 0, 0 ] ],
		[ 'hsl(120deg 100% 25%)', [ 0, 128, 0 ] ],
		[ 'hsl(480, 100%, 25%)', [ 0, 128, 0 ] ],
	] )( 'reads %s', ( color, expected ) => {
		expect( parseColor( color ) ).toEqual( expected );
	} );

	// A translucent color's look depends on what is behind it, so contrast against it is not a
	// number. The rest are values a caller has to leave exactly as it found them.
	it.each( [
		[ '#ffffff80' ],
		[ '#fff8' ],
		[ 'rgba(0, 0, 0, 0.5)' ],
		[ 'rgb(0 0 0 / 50%)' ],
		[ 'red' ],
		[ 'transparent' ],
		[ 'currentcolor' ],
		[ 'var(--wp--preset--color--base)' ],
		[ 'var:preset|color|base' ],
		[ 'linear-gradient(#fff, #000)' ],
		[ 'rgb(0, 0)' ],
		[ 'rgb(255 255 255 1)' ],
		[ 'rgb(0,0,0/1)' ],
		[ 'rgb(0, 0 0)' ],
		[ 'rgb(0 0 0 / 1 / 1)' ],
		[ 'hsl(0, 100, 50)' ],
		[ '#abcde' ],
		[ '' ],
		[ null ],
		[ undefined ],
		[ 0 ],
	] )( 'refuses %p', color => {
		expect( parseColor( color ) ).toBeNull();
		expect( deriveTextColor( color ) ).toBeNull();
	} );
} );

describe( 'deriveTextColor', () => {
	it( 'matches every pair shared with the WordPress.com renderer', () => {
		expect( fixture.minimumContrast ).toBe( MINIMUM_CONTRAST );
		expect( fixture.cases.length ).toBeGreaterThan( 0 );

		expect( fixture.cases.map( ( { background } ) => deriveTextColor( background ) ) ).toEqual(
			fixture.cases.map( ( { text } ) => text )
		);
	} );

	// The guarantee the derivation exists for. It covers the backgrounds where the starting tint
	// alone falls short -- pure red starts at 3.99:1 -- so it fails if the search stops early.
	it( 'meets the minimum on every hue, saturation and lightness', () => {
		const failures = [];

		for ( let hue = 0; hue <= 330; hue += 30 ) {
			for ( const saturation of [ 0, 50, 100 ] ) {
				for ( let lightness = 0; lightness <= 100; lightness += 10 ) {
					const background = `hsl(${ hue }, ${ saturation }%, ${ lightness }%)`;
					const text = deriveTextColor( background );

					if (
						! /^#[0-9a-f]{6}$/.test( text ?? '' ) ||
						contrastRatio( text, background ) < MINIMUM_CONTRAST
					) {
						failures.push( `${ text } on ${ background }` );
					}
				}
			}
		}

		expect( failures ).toEqual( [] );
	} );

	it( 'darkens light backgrounds and lightens dark ones', () => {
		expect( contrastRatio( deriveTextColor( '#ffffff' ), '#000000' ) ).toBeLessThan(
			contrastRatio( '#ffffff', '#000000' )
		);
		expect( contrastRatio( deriveTextColor( '#002b36' ), '#000000' ) ).toBeGreaterThan(
			contrastRatio( '#002b36', '#000000' )
		);
	} );

	it( 'tints rather than neutralizes', () => {
		const [ paleRed, paleGreen, paleBlue ] = parseColor( deriveTextColor( '#e8f4ff' ) );
		expect( paleBlue ).toBeGreaterThan( paleGreen );
		expect( paleGreen ).toBeGreaterThan( paleRed );

		const [ creamRed, creamGreen, creamBlue ] = parseColor( deriveTextColor( '#f5efe0' ) );
		expect( creamRed ).toBeGreaterThan( creamGreen );
		expect( creamGreen ).toBeGreaterThan( creamBlue );

		for ( const gray of [ '#ffffff', '#777777', '#1e1e1e' ] ) {
			const [ red, green, blue ] = parseColor( deriveTextColor( gray ) );

			expect( red ).toBe( green );
			expect( green ).toBe( blue );
		}
	} );
} );
