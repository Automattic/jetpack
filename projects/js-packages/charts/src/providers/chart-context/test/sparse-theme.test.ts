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

	it( 'points every themed colour at an --a8c-charts-* catalog role', () => {
		const varStrings = strings.filter( value => value.startsWith( 'var(' ) );

		expect( varStrings.length ).toBeGreaterThan( 0 );
		expect( varStrings.every( value => value.startsWith( 'var(--a8c-charts-' ) ) ).toBe( true );
	} );

	it( 'gives every catalog pointer a terminal literal for the SSR and jsdom paths', () => {
		const varStrings = strings.filter( value => value.startsWith( 'var(--a8c-charts-' ) );

		expect( varStrings.every( value => value.includes( ',' ) ) ).toBe( true );
	} );
} );
