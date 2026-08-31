import { defaultTheme } from '../themes';

const flatten = ( value: unknown ): string[] => {
	if ( typeof value === 'string' ) {
		return [ value ];
	}
	if ( Array.isArray( value ) ) {
		return value.flatMap( flatten );
	}
	if ( value && typeof value === 'object' ) {
		return Object.values( value ).flatMap( flatten );
	}
	return [];
};

describe( 'defaultTheme', () => {
	const strings = flatten( defaultTheme );

	it( 'holds no --wpds-* mapping — that lives only in the catalog stylesheet', () => {
		expect( strings.filter( value => value.includes( '--wpds-' ) ) ).toEqual( [] );
	} );

	it( 'points every themed color at an --a8c-charts-* catalog role', () => {
		const varStrings = strings.filter( value => value.startsWith( 'var(' ) );

		expect( varStrings.length ).toBeGreaterThan( 0 );
		expect( varStrings.every( value => value.startsWith( 'var(--a8c-charts-' ) ) ).toBe( true );
	} );

	// The palette slots past the first are the exception, below: a terminal literal there would be a color nobody chose.
	it( 'gives every catalog pointer a terminal literal for the SSR and jsdom paths', () => {
		const varStrings = strings
			.filter( value => value.startsWith( 'var(--a8c-charts-' ) )
			.filter( value => ! /^var\( *--a8c-charts-color-series-[2-9] *\)$/.test( value ) );

		expect( varStrings.every( value => value.includes( ',' ) ) ).toBe( true );
	} );

	// Only slot 1 seeds a palette. The rest resolve to nothing until a consumer sets them, and the provider drops what resolves to nothing, so the palette compacts instead of repeating one color.
	it( 'leaves the palette slots past the first with no default of their own', () => {
		expect( defaultTheme.colors ).toEqual( [
			'var(--a8c-charts-color-series-1, #3858e9)',
			'var(--a8c-charts-color-series-2)',
			'var(--a8c-charts-color-series-3)',
			'var(--a8c-charts-color-series-4)',
			'var(--a8c-charts-color-series-5)',
		] );
	} );
} );
