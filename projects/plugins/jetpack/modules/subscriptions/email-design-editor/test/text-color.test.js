import {
	contrastRatio,
	deriveTextColor,
	isNeutral,
	parseColor,
	readableOn,
	textFor,
	MINIMUM_CONTRAST,
} from '../src/text-color';
import parseFixture from './data/parse-color.json';
import elementsFixture from './data/readable-elements.json';
import readableFixture from './data/readable-on.json';
import fixture from './data/text-color-derivation.json';

describe( 'contrastRatio', () => {
	it.each( parseFixture.contrast )( 'matches WCAG for $label', ( { first, second, ratio } ) => {
		expect( Number( contrastRatio( first, second ).toFixed( 2 ) ) ).toBe( ratio );
		expect( Number( contrastRatio( second, first ).toFixed( 2 ) ) ).toBe( ratio );
	} );

	it( 'is null when a color cannot be read', () => {
		expect( contrastRatio( 'red', '#ffffff' ) ).toBeNull();
		expect( contrastRatio( '#ffffff', 'rgba(0, 0, 0, 0.5)' ) ).toBeNull();
	} );
} );

describe( 'parseColor', () => {
	it.each( parseFixture.parse )( 'reads $label', ( { color, rgb } ) => {
		expect( parseColor( color ) ).toEqual( rgb );
	} );

	// A translucent color's look depends on what is behind it, so contrast against it is not a
	// number. The rest are values a caller has to leave exactly as it found them.
	it.each( parseFixture.refuse )( 'refuses $label', ( { color } ) => {
		expect( parseColor( color ) ).toBeNull();
		expect( deriveTextColor( color ) ).toBeNull();
	} );

	// Not in the shared fixture, because JSON cannot carry it.
	it( 'refuses undefined', () => {
		expect( parseColor( undefined ) ).toBeNull();
		expect( deriveTextColor( undefined ) ).toBeNull();
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

describe( 'readableOn', () => {
	it( 'matches every pair shared with the WordPress.com renderer', () => {
		expect( readableFixture.minimumContrast ).toBe( MINIMUM_CONTRAST );
		expect( readableFixture.cases.length ).toBeGreaterThan( 0 );

		expect(
			readableFixture.cases.map( ( { color, background } ) => readableOn( color, background ) )
		).toEqual( readableFixture.cases.map( ( { readable } ) => readable ) );
	} );

	it( 'keeps the hue it was given', () => {
		const [ red, green, blue ] = parseColor( readableOn( '#0073aa', '#1e1e1e' ) );

		expect( blue ).toBeGreaterThan( green );
		expect( green ).toBeGreaterThan( red );
	} );

	// What separates it from deriveTextColor, which replaces a color outright.
	it( 'leaves a color that already passes exactly as it was', () => {
		expect( readableOn( '#0073aa', '#ffffff' ) ).toBe( '#0073aa' );
		expect( readableOn( 'rgb(0 115 170)', '#ffffff' ) ).toBe( '#0073aa' );
	} );

	it( 'meets the minimum on every hue, saturation and lightness', () => {
		const failures = [];

		for ( const background of [ '#ffffff', '#1e1e1e', '#113af5', '#f59e0b' ] ) {
			for ( let hue = 0; hue <= 330; hue += 30 ) {
				for ( const saturation of [ 0, 50, 100 ] ) {
					for ( let lightness = 0; lightness <= 100; lightness += 10 ) {
						const color = `hsl(${ hue }, ${ saturation }%, ${ lightness }%)`;
						const readable = readableOn( color, background );

						if ( contrastRatio( readable, background ) < MINIMUM_CONTRAST ) {
							failures.push( `${ readable } on ${ background }` );
						}
					}
				}
			}
		}

		expect( failures ).toEqual( [] );
	} );

	it( 'is null when either color cannot be read', () => {
		expect( readableOn( 'var(--accent)', '#ffffff' ) ).toBeNull();
		expect( readableOn( '#0073aa', 'rgba(0, 0, 0, 0.5)' ) ).toBeNull();
	} );
} );

describe( 'textFor', () => {
	it.each( elementsFixture.text )(
		'matches the renderer for $color on $background',
		( { color, background, readable } ) => {
			expect( textFor( color, background ) ).toBe( readable );
		}
	);

	it.each( elementsFixture.button )(
		'matches the renderer for button $color on $background',
		( { color, background, readable } ) => {
			expect( textFor( color, background ) ).toBe( readable );
		}
	);
} );

describe( 'isNeutral', () => {
	it( 'matches the WordPress.com renderer on every shared color', () => {
		expect( readableFixture.neutral.map( ( { color } ) => isNeutral( color ) ) ).toEqual(
			readableFixture.neutral.map( ( { neutral } ) => neutral )
		);

		expect( readableFixture.cases.map( ( { readable } ) => isNeutral( readable ) ) ).toEqual(
			readableFixture.cases.map( ( { neutral } ) => neutral )
		);
	} );

	it( 'is null when the color cannot be read', () => {
		expect( isNeutral( 'var(--accent)' ) ).toBeNull();
	} );
} );
