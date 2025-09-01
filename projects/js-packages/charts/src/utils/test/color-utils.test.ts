import { hexToRgba } from '../color-utils';

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

		// Function now validates hex input format
		it( 'throws error for hex without # prefix', () => {
			expect( () => hexToRgba( 'ff0000', 1 ) ).toThrow( 'Hex color must start with #' );
		} );
	} );

	describe( 'Input validation', () => {
		describe( 'Invalid hex format', () => {
			it( 'throws error for non-string input', () => {
				expect( () => hexToRgba( 123 as unknown as string, 1 ) ).toThrow(
					'Hex color must be a string'
				);
				expect( () => hexToRgba( null as unknown as string, 1 ) ).toThrow(
					'Hex color must be a string'
				);
				expect( () => hexToRgba( undefined as unknown as string, 1 ) ).toThrow(
					'Hex color must be a string'
				);
			} );

			it( 'throws error for hex without # prefix', () => {
				expect( () => hexToRgba( 'ff0000', 1 ) ).toThrow( 'Hex color must start with #' );
				expect( () => hexToRgba( '000000', 1 ) ).toThrow( 'Hex color must start with #' );
			} );

			it( 'throws error for wrong length hex strings', () => {
				expect( () => hexToRgba( '#ff', 1 ) ).toThrow(
					'Hex color must be 7 characters long (e.g., #ff0000)'
				);
				expect( () => hexToRgba( '#fff', 1 ) ).toThrow(
					'Hex color must be 7 characters long (e.g., #ff0000)'
				);
				expect( () => hexToRgba( '#ffff', 1 ) ).toThrow(
					'Hex color must be 7 characters long (e.g., #ff0000)'
				);
				expect( () => hexToRgba( '#fffff', 1 ) ).toThrow(
					'Hex color must be 7 characters long (e.g., #ff0000)'
				);
				expect( () => hexToRgba( '#ff00000', 1 ) ).toThrow(
					'Hex color must be 7 characters long (e.g., #ff0000)'
				);
				expect( () => hexToRgba( '#', 1 ) ).toThrow(
					'Hex color must be 7 characters long (e.g., #ff0000)'
				);
			} );

			it( 'throws error for invalid hex characters', () => {
				expect( () => hexToRgba( '#gggggg', 1 ) ).toThrow(
					'Hex color contains invalid characters. Only 0-9, a-f, A-F are allowed'
				);
				expect( () => hexToRgba( '#ff00gg', 1 ) ).toThrow(
					'Hex color contains invalid characters. Only 0-9, a-f, A-F are allowed'
				);
				expect( () => hexToRgba( '#zz0000', 1 ) ).toThrow(
					'Hex color contains invalid characters. Only 0-9, a-f, A-F are allowed'
				);
				expect( () => hexToRgba( '#ff@000', 1 ) ).toThrow(
					'Hex color contains invalid characters. Only 0-9, a-f, A-F are allowed'
				);
				expect( () => hexToRgba( '#ff 000', 1 ) ).toThrow(
					'Hex color contains invalid characters. Only 0-9, a-f, A-F are allowed'
				);
			} );

			it( 'throws error for empty string', () => {
				expect( () => hexToRgba( '', 1 ) ).toThrow( 'Hex color must start with #' );
			} );
		} );

		describe( 'Invalid alpha values', () => {
			it( 'throws error for non-number alpha', () => {
				expect( () => hexToRgba( '#ff0000', 'invalid' as unknown as number ) ).toThrow(
					'Alpha must be a number'
				);
				expect( () => hexToRgba( '#ff0000', null as unknown as number ) ).toThrow(
					'Alpha must be a number'
				);
				expect( () => hexToRgba( '#ff0000', undefined as unknown as number ) ).toThrow(
					'Alpha must be a number'
				);
				expect( () => hexToRgba( '#ff0000', {} as unknown as number ) ).toThrow(
					'Alpha must be a number'
				);
			} );

			it( 'throws error for NaN alpha', () => {
				expect( () => hexToRgba( '#ff0000', NaN ) ).toThrow( 'Alpha must be a number' );
			} );

			it( 'accepts negative and greater than 1 alpha values (CSS allows this)', () => {
				// These should not throw - CSS allows alpha values outside 0-1 range
				expect( () => hexToRgba( '#ff0000', -0.5 ) ).not.toThrow();
				expect( () => hexToRgba( '#ff0000', 1.5 ) ).not.toThrow();
				expect( () => hexToRgba( '#ff0000', 2 ) ).not.toThrow();
			} );
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
