import { hexToRgba } from '../utils/color-utils';

describe( 'hexToRgba', () => {
	describe( 'Valid hex colors', () => {
		it( 'converts 6-digit hex to rgba with full opacity', () => {
			const result = hexToRgba( '#ff0000', 1 );
			expect( result ).toBe( 'rgba(255, 0, 0, 1)' );
		} );

		it( 'converts 6-digit hex to rgba with partial opacity', () => {
			const result = hexToRgba( '#00ff00', 0.5 );
			expect( result ).toBe( 'rgba(0, 255, 0, 0.5)' );
		} );

		it( 'converts 6-digit hex to rgba with zero opacity', () => {
			const result = hexToRgba( '#0000ff', 0 );
			expect( result ).toBe( 'rgba(0, 0, 255, 0)' );
		} );

		it( 'handles lowercase hex colors', () => {
			const result = hexToRgba( '#abcdef', 0.8 );
			expect( result ).toBe( 'rgba(171, 205, 239, 0.8)' );
		} );

		it( 'handles uppercase hex colors', () => {
			const result = hexToRgba( '#ABCDEF', 0.8 );
			expect( result ).toBe( 'rgba(171, 205, 239, 0.8)' );
		} );

		it( 'handles mixed case hex colors', () => {
			const result = hexToRgba( '#AbCdEf', 0.3 );
			expect( result ).toBe( 'rgba(171, 205, 239, 0.3)' );
		} );
	} );

	describe( 'Edge cases', () => {
		it( 'handles black color', () => {
			const result = hexToRgba( '#000000', 1 );
			expect( result ).toBe( 'rgba(0, 0, 0, 1)' );
		} );

		it( 'handles white color', () => {
			const result = hexToRgba( '#ffffff', 1 );
			expect( result ).toBe( 'rgba(255, 255, 255, 1)' );
		} );

		it( 'handles high precision alpha values', () => {
			const result = hexToRgba( '#ff0000', 0.123456 );
			expect( result ).toBe( 'rgba(255, 0, 0, 0.123456)' );
		} );

		// Note: Function expects hex with # prefix - without it, it treats 'f' as hex digit
		it( 'handles hex starting with f (edge case)', () => {
			const result = hexToRgba( 'ff0000', 1 );
			expect( result ).toBe( 'rgba(240, 0, 0, 1)' ); // 'f' = 15, 'f0' = 240
		} );
	} );

	describe( 'Real-world color examples', () => {
		it( 'converts primary blue color', () => {
			const result = hexToRgba( '#4f46e5', 0.08 );
			expect( result ).toBe( 'rgba(79, 70, 229, 0.08)' );
		} );

		it( 'converts success green color', () => {
			const result = hexToRgba( '#10b981', 0.15 );
			expect( result ).toBe( 'rgba(16, 185, 129, 0.15)' );
		} );

		it( 'converts error red color', () => {
			const result = hexToRgba( '#ef4444', 0.2 );
			expect( result ).toBe( 'rgba(239, 68, 68, 0.2)' );
		} );

		it( 'converts gray color', () => {
			const result = hexToRgba( '#6b7280', 0.6 );
			expect( result ).toBe( 'rgba(107, 114, 128, 0.6)' );
		} );
	} );

	describe( 'Boundary alpha values', () => {
		it( 'handles alpha value of 0', () => {
			const result = hexToRgba( '#ff0000', 0 );
			expect( result ).toBe( 'rgba(255, 0, 0, 0)' );
		} );

		it( 'handles alpha value of 1', () => {
			const result = hexToRgba( '#ff0000', 1 );
			expect( result ).toBe( 'rgba(255, 0, 0, 1)' );
		} );

		it( 'handles negative alpha values', () => {
			const result = hexToRgba( '#ff0000', -0.5 );
			expect( result ).toBe( 'rgba(255, 0, 0, -0.5)' );
		} );

		it( 'handles alpha values greater than 1', () => {
			const result = hexToRgba( '#ff0000', 1.5 );
			expect( result ).toBe( 'rgba(255, 0, 0, 1.5)' );
		} );
	} );

	describe( 'Color component extraction', () => {
		it( 'correctly extracts red component', () => {
			const result = hexToRgba( '#ff0000', 1 );
			expect( result ).toContain( '255, 0, 0' );
		} );

		it( 'correctly extracts green component', () => {
			const result = hexToRgba( '#00ff00', 1 );
			expect( result ).toContain( '0, 255, 0' );
		} );

		it( 'correctly extracts blue component', () => {
			const result = hexToRgba( '#0000ff', 1 );
			expect( result ).toContain( '0, 0, 255' );
		} );

		it( 'correctly extracts all components for mixed color', () => {
			const result = hexToRgba( '#8a2be2', 1 ); // BlueViolet
			expect( result ).toBe( 'rgba(138, 43, 226, 1)' );
		} );
	} );

	describe( 'Typical usage patterns', () => {
		it( 'works with common CSS background opacity', () => {
			const result = hexToRgba( '#4f46e5', 0.08 );
			expect( result ).toBe( 'rgba(79, 70, 229, 0.08)' );
		} );

		it( 'works with hover state opacity', () => {
			const result = hexToRgba( '#4f46e5', 0.15 );
			expect( result ).toBe( 'rgba(79, 70, 229, 0.15)' );
		} );

		it( 'works with disabled state opacity', () => {
			const result = hexToRgba( '#4f46e5', 0.3 );
			expect( result ).toBe( 'rgba(79, 70, 229, 0.3)' );
		} );
	} );
} );
