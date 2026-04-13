import { resolveFontSize } from '../resolve-font-size';

describe( 'resolveFontSize', () => {
	describe( 'numeric input', () => {
		it( 'returns whole numbers as-is', () => {
			expect( resolveFontSize( 12 ) ).toBe( 12 );
			expect( resolveFontSize( 0 ) ).toBe( 0 );
		} );

		it( 'returns decimal numbers as-is', () => {
			expect( resolveFontSize( 13.5 ) ).toBe( 13.5 );
		} );

		it( 'returns undefined for NaN', () => {
			expect( resolveFontSize( NaN ) ).toBeUndefined();
		} );
	} );

	describe( 'string input', () => {
		it( 'parses bare numeric strings', () => {
			expect( resolveFontSize( '12' ) ).toBe( 12 );
			expect( resolveFontSize( '13.5' ) ).toBe( 13.5 );
		} );

		it( 'parses pixel strings', () => {
			expect( resolveFontSize( '12px' ) ).toBe( 12 );
			expect( resolveFontSize( '13.5px' ) ).toBe( 13.5 );
		} );

		it( 'trims whitespace before parsing', () => {
			expect( resolveFontSize( '  14px  ' ) ).toBe( 14 );
		} );

		it( 'rejects rem values rather than returning the unitless prefix', () => {
			expect( resolveFontSize( '0.875rem' ) ).toBeUndefined();
		} );

		it( 'rejects em, %, vh, vw and other relative units', () => {
			expect( resolveFontSize( '1em' ) ).toBeUndefined();
			expect( resolveFontSize( '100%' ) ).toBeUndefined();
			expect( resolveFontSize( '2vh' ) ).toBeUndefined();
			expect( resolveFontSize( '2vw' ) ).toBeUndefined();
		} );

		it( 'rejects keywords like inherit, initial, unset', () => {
			expect( resolveFontSize( 'inherit' ) ).toBeUndefined();
			expect( resolveFontSize( 'initial' ) ).toBeUndefined();
			expect( resolveFontSize( 'medium' ) ).toBeUndefined();
		} );

		it( 'returns undefined for empty string', () => {
			expect( resolveFontSize( '' ) ).toBeUndefined();
		} );

		it( 'returns undefined for unparseable strings', () => {
			expect( resolveFontSize( 'abc' ) ).toBeUndefined();
			expect( resolveFontSize( 'pxpx' ) ).toBeUndefined();
		} );
	} );

	describe( 'missing input', () => {
		it( 'returns undefined for undefined', () => {
			expect( resolveFontSize( undefined ) ).toBeUndefined();
		} );
	} );
} );
