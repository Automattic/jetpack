import { ANNOTATION_POINTERS, CATALOG_POINTERS } from '../private/catalog-pointers';
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

const pointerStrings = [ ...flatten( CATALOG_POINTERS ), ...flatten( ANNOTATION_POINTERS ) ];

describe( 'catalog pointers', () => {
	it( 'holds no --wpds-* mapping — that lives only in the catalog stylesheet', () => {
		expect( pointerStrings.filter( value => value.includes( '--wpds-' ) ) ).toEqual( [] );
	} );

	it( 'points every color at an --a8c-charts-* catalog role', () => {
		const varStrings = pointerStrings.filter( value => value.startsWith( 'var(' ) );

		expect( varStrings.length ).toBeGreaterThan( 0 );
		expect( varStrings.every( value => value.startsWith( 'var(--a8c-charts-' ) ) ).toBe( true );
	} );

	// Palette slots past the first are the exception: a literal there would be a color nobody chose.
	it( 'gives every pointer a terminal literal for the SSR and jsdom paths', () => {
		const varStrings = pointerStrings
			.filter( value => value.startsWith( 'var(--a8c-charts-' ) )
			.filter( value => ! /^var\( *--a8c-charts-color-series-[2-9] *\)$/.test( value ) );

		expect( varStrings.every( value => value.includes( ',' ) ) ).toBe( true );
	} );

	it( 'leaves the palette slots past the first with no default of their own', () => {
		expect( CATALOG_POINTERS.series ).toEqual( [
			'var(--a8c-charts-color-series-1, #3858e9)',
			'var(--a8c-charts-color-series-2)',
			'var(--a8c-charts-color-series-3)',
			'var(--a8c-charts-color-series-4)',
			'var(--a8c-charts-color-series-5)',
		] );
	} );
} );

describe( 'defaultTheme', () => {
	// A color has one route, a `--a8c-charts-color-*` role set in CSS. One reappearing
	// here would be a second.
	it( 'holds no color at all', () => {
		const colorish = flatten( defaultTheme ).filter( value =>
			/^(#|rgb|hsl|var\(--a8c-charts-color)/.test( value.trim() )
		);

		expect( colorish ).toEqual( [] );
	} );
} );
