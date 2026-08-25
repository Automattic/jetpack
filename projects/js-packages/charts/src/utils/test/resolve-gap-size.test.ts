import { resolveGapSize } from '../resolve-gap-size';

describe( 'resolveGapSize', () => {
	it( 'maps a scale step to its design system token', () => {
		expect( resolveGapSize( 'xs' ) ).toBe( 'var(--wpds-dimension-gap-xs, 4px)' );
		expect( resolveGapSize( '3xl' ) ).toBe( 'var(--wpds-dimension-gap-3xl, 40px)' );
	} );

	it( 'passes a pixel number through, so a theme can still opt out of the scale', () => {
		expect( resolveGapSize( 6 ) ).toBe( 6 );
		expect( resolveGapSize( 0 ) ).toBe( 0 );
	} );

	it( 'returns undefined when the theme sets no gap', () => {
		expect( resolveGapSize( undefined ) ).toBeUndefined();
	} );
} );
