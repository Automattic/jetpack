import {
	hexToRgba,
	hexToHsl,
	getColorDistance,
	lightenHexColor,
	isValidHexColor,
	validateHexColor,
} from '../color-utils';

describe( 'isValidHexColor', () => {
	describe( 'Valid hex colors', () => {
		it( 'returns true for valid 6-digit hex with lowercase', () => {
			expect( isValidHexColor( '#abcdef' ) ).toBe( true );
		} );

		it( 'returns true for valid 6-digit hex with uppercase', () => {
			expect( isValidHexColor( '#ABCDEF' ) ).toBe( true );
		} );

		it( 'returns true for valid 6-digit hex with mixed case', () => {
			expect( isValidHexColor( '#AbCdEf' ) ).toBe( true );
		} );

		it( 'returns true for black', () => {
			expect( isValidHexColor( '#000000' ) ).toBe( true );
		} );

		it( 'returns true for white', () => {
			expect( isValidHexColor( '#ffffff' ) ).toBe( true );
		} );
	} );

	describe( 'Invalid inputs', () => {
		it( 'returns false for hex without #', () => {
			expect( isValidHexColor( 'abcdef' ) ).toBe( false );
		} );

		it( 'returns false for 3-digit hex', () => {
			expect( isValidHexColor( '#abc' ) ).toBe( false );
		} );

		it( 'returns false for 8-digit hex (with alpha)', () => {
			expect( isValidHexColor( '#abcdef00' ) ).toBe( false );
		} );

		it( 'returns false for empty string', () => {
			expect( isValidHexColor( '' ) ).toBe( false );
		} );

		it( 'returns false for null', () => {
			expect( isValidHexColor( null ) ).toBe( false );
		} );

		it( 'returns false for undefined', () => {
			expect( isValidHexColor( undefined ) ).toBe( false );
		} );

		it( 'returns false for number', () => {
			expect( isValidHexColor( 123456 ) ).toBe( false );
		} );

		it( 'returns false for invalid hex characters', () => {
			expect( isValidHexColor( '#gggggg' ) ).toBe( false );
		} );

		it( 'returns false for CSS color names', () => {
			expect( isValidHexColor( 'red' ) ).toBe( false );
		} );

		it( 'returns false for rgba values', () => {
			expect( isValidHexColor( 'rgba(255, 0, 0, 1)' ) ).toBe( false );
		} );
	} );
} );

describe( 'validateHexColor', () => {
	describe( 'Valid hex colors', () => {
		it( 'does not throw for valid 6-digit hex', () => {
			expect( () => validateHexColor( '#abcdef' ) ).not.toThrow();
		} );

		it( 'does not throw for black', () => {
			expect( () => validateHexColor( '#000000' ) ).not.toThrow();
		} );

		it( 'does not throw for white', () => {
			expect( () => validateHexColor( '#ffffff' ) ).not.toThrow();
		} );
	} );

	describe( 'Invalid inputs with specific error messages', () => {
		it( 'throws for non-string input', () => {
			expect( () => validateHexColor( 123456 ) ).toThrow( 'Hex color must be a string' );
		} );

		it( 'throws for hex without #', () => {
			expect( () => validateHexColor( 'abcdef' ) ).toThrow( 'Hex color must start with #' );
		} );

		it( 'throws for 3-digit hex', () => {
			expect( () => validateHexColor( '#abc' ) ).toThrow( 'Hex color must be 7 characters long' );
		} );

		it( 'throws for 8-digit hex', () => {
			expect( () => validateHexColor( '#abcdef00' ) ).toThrow(
				'Hex color must be 7 characters long'
			);
		} );

		it( 'throws for invalid hex characters', () => {
			expect( () => validateHexColor( '#gggggg' ) ).toThrow(
				'Hex color contains invalid characters'
			);
		} );
	} );
} );

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

describe( 'hexToHsl', () => {
	describe( 'Basic color conversions', () => {
		it( 'converts pure red to HSL', () => {
			const result = hexToHsl( '#ff0000' );
			expect( result ).toEqual( [ 0, 100, 50 ] );
		} );

		it( 'converts pure green to HSL', () => {
			const result = hexToHsl( '#00ff00' );
			expect( result ).toEqual( [ 120, 100, 50 ] );
		} );

		it( 'converts pure blue to HSL', () => {
			const result = hexToHsl( '#0000ff' );
			expect( result ).toEqual( [ 240, 100, 50 ] );
		} );

		it( 'converts white to HSL', () => {
			const result = hexToHsl( '#ffffff' );
			expect( result ).toEqual( [ 0, 0, 100 ] );
		} );

		it( 'converts black to HSL', () => {
			const result = hexToHsl( '#000000' );
			expect( result ).toEqual( [ 0, 0, 0 ] );
		} );

		it( 'converts gray to HSL', () => {
			const result = hexToHsl( '#808080' );
			// Gray should have no hue or saturation, lightness around 50%
			expect( result[ 0 ] ).toBe( 0 ); // Hue
			expect( result[ 1 ] ).toBe( 0 ); // Saturation
			expect( result[ 2 ] ).toBeCloseTo( 50.2, 1 ); // Lightness
		} );
	} );

	describe( 'Complex color conversions', () => {
		it( 'converts cyan to HSL', () => {
			const result = hexToHsl( '#00ffff' );
			expect( result ).toEqual( [ 180, 100, 50 ] );
		} );

		it( 'converts magenta to HSL', () => {
			const result = hexToHsl( '#ff00ff' );
			expect( result ).toEqual( [ 300, 100, 50 ] );
		} );

		it( 'converts yellow to HSL', () => {
			const result = hexToHsl( '#ffff00' );
			expect( result ).toEqual( [ 60, 100, 50 ] );
		} );

		it( 'converts orange to HSL', () => {
			const result = hexToHsl( '#ffa500' );
			expect( result[ 0 ] ).toBeCloseTo( 38.8, 1 ); // Hue
			expect( result[ 1 ] ).toBe( 100 ); // Saturation
			expect( result[ 2 ] ).toBeCloseTo( 50, 1 ); // Lightness
		} );

		it( 'converts purple to HSL', () => {
			const result = hexToHsl( '#800080' );
			expect( result[ 0 ] ).toBe( 300 ); // Hue
			expect( result[ 1 ] ).toBe( 100 ); // Saturation
			expect( result[ 2 ] ).toBeCloseTo( 25.1, 1 ); // Lightness
		} );
	} );

	describe( 'Real-world color examples', () => {
		it( 'converts primary blue color', () => {
			const result = hexToHsl( '#4f46e5' );
			expect( result[ 0 ] ).toBeCloseTo( 243.4, 1 ); // Hue
			expect( result[ 1 ] ).toBeCloseTo( 75.4, 1 ); // Saturation
			expect( result[ 2 ] ).toBeCloseTo( 58.6, 1 ); // Lightness
		} );

		it( 'converts success green color', () => {
			const result = hexToHsl( '#10b981' );
			expect( result[ 0 ] ).toBeCloseTo( 160.1, 1 ); // Hue
			expect( result[ 1 ] ).toBeCloseTo( 84.1, 1 ); // Saturation
			expect( result[ 2 ] ).toBeCloseTo( 39.4, 1 ); // Lightness
		} );

		it( 'converts error red color', () => {
			const result = hexToHsl( '#ef4444' );
			expect( result[ 0 ] ).toBe( 0 ); // Hue
			expect( result[ 1 ] ).toBeCloseTo( 84.2, 1 ); // Saturation
			expect( result[ 2 ] ).toBeCloseTo( 60.2, 1 ); // Lightness
		} );
	} );

	describe( 'Input validation', () => {
		describe( 'Invalid hex format', () => {
			it( 'throws error for non-string input', () => {
				expect( () => hexToHsl( 123 as unknown as string ) ).toThrow(
					'Hex color must be a string'
				);
				expect( () => hexToHsl( null as unknown as string ) ).toThrow(
					'Hex color must be a string'
				);
				expect( () => hexToHsl( undefined as unknown as string ) ).toThrow(
					'Hex color must be a string'
				);
			} );

			it( 'throws error for hex without # prefix', () => {
				expect( () => hexToHsl( 'ff0000' ) ).toThrow( 'Hex color must start with #' );
				expect( () => hexToHsl( '000000' ) ).toThrow( 'Hex color must start with #' );
			} );

			it( 'throws error for wrong length hex strings', () => {
				expect( () => hexToHsl( '#ff' ) ).toThrow(
					'Hex color must be 7 characters long (e.g., #ff0000)'
				);
				expect( () => hexToHsl( '#fff' ) ).toThrow(
					'Hex color must be 7 characters long (e.g., #ff0000)'
				);
				expect( () => hexToHsl( '#ffff' ) ).toThrow(
					'Hex color must be 7 characters long (e.g., #ff0000)'
				);
				expect( () => hexToHsl( '#fffff' ) ).toThrow(
					'Hex color must be 7 characters long (e.g., #ff0000)'
				);
				expect( () => hexToHsl( '#ff00000' ) ).toThrow(
					'Hex color must be 7 characters long (e.g., #ff0000)'
				);
				expect( () => hexToHsl( '#' ) ).toThrow(
					'Hex color must be 7 characters long (e.g., #ff0000)'
				);
			} );

			it( 'throws error for invalid hex characters', () => {
				expect( () => hexToHsl( '#gggggg' ) ).toThrow(
					'Hex color contains invalid characters. Only 0-9, a-f, A-F are allowed'
				);
				expect( () => hexToHsl( '#ff00gg' ) ).toThrow(
					'Hex color contains invalid characters. Only 0-9, a-f, A-F are allowed'
				);
				expect( () => hexToHsl( '#zz0000' ) ).toThrow(
					'Hex color contains invalid characters. Only 0-9, a-f, A-F are allowed'
				);
				expect( () => hexToHsl( '#ff@000' ) ).toThrow(
					'Hex color contains invalid characters. Only 0-9, a-f, A-F are allowed'
				);
				expect( () => hexToHsl( '#ff 000' ) ).toThrow(
					'Hex color contains invalid characters. Only 0-9, a-f, A-F are allowed'
				);
			} );

			it( 'throws error for empty string', () => {
				expect( () => hexToHsl( '' ) ).toThrow( 'Hex color must start with #' );
			} );
		} );
	} );

	describe( 'Edge cases and precision', () => {
		it( 'handles colors with very low saturation', () => {
			const result = hexToHsl( '#fefefe' );
			expect( result[ 0 ] ).toBe( 0 ); // Hue should be 0 for near-white
			expect( result[ 1 ] ).toBe( 0 ); // Saturation should be 0 for near-white
			expect( result[ 2 ] ).toBeCloseTo( 99.6, 1 ); // Very high lightness
		} );

		it( 'handles colors with very high saturation', () => {
			const result = hexToHsl( '#ff0001' );
			expect( result[ 0 ] ).toBeCloseTo( 359.8, 1 ); // Hue close to red
			expect( result[ 1 ] ).toBe( 100 ); // Full saturation
			expect( result[ 2 ] ).toBeCloseTo( 50.0, 1 ); // Medium lightness
		} );

		it( 'returns array with exactly 3 elements', () => {
			const result = hexToHsl( '#abcdef' );
			expect( result ).toHaveLength( 3 );
		} );

		it( 'returns hue in 0-360 range', () => {
			const colors = [ '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff' ];
			colors.forEach( color => {
				const [ h ] = hexToHsl( color );
				expect( h ).toBeGreaterThanOrEqual( 0 );
				expect( h ).toBeLessThan( 360 );
			} );
		} );

		it( 'returns saturation in 0-100 range', () => {
			const colors = [ '#ff0000', '#808080', '#ffffff', '#000000', '#abcdef' ];
			colors.forEach( color => {
				const [ , s ] = hexToHsl( color );
				expect( s ).toBeGreaterThanOrEqual( 0 );
				expect( s ).toBeLessThanOrEqual( 100 );
			} );
		} );

		it( 'returns lightness in 0-100 range', () => {
			const colors = [ '#ff0000', '#808080', '#ffffff', '#000000', '#abcdef' ];
			colors.forEach( color => {
				const [ , , l ] = hexToHsl( color );
				expect( l ).toBeGreaterThanOrEqual( 0 );
				expect( l ).toBeLessThanOrEqual( 100 );
			} );
		} );
	} );
} );

describe( 'getColorDistance', () => {
	describe( 'Identical colors', () => {
		it( 'returns 0 for identical colors', () => {
			const color1: [ number, number, number ] = [ 120, 50, 50 ];
			const color2: [ number, number, number ] = [ 120, 50, 50 ];
			const distance = getColorDistance( color1, color2 );
			expect( distance ).toBe( 0 );
		} );

		it( 'returns 0 for black with black', () => {
			const black: [ number, number, number ] = [ 0, 0, 0 ];
			const distance = getColorDistance( black, black );
			expect( distance ).toBe( 0 );
		} );

		it( 'returns 0 for white with white', () => {
			const white: [ number, number, number ] = [ 0, 0, 100 ];
			const distance = getColorDistance( white, white );
			expect( distance ).toBe( 0 );
		} );
	} );

	describe( 'Hue differences', () => {
		it( 'calculates distance for colors with different hues', () => {
			const red: [ number, number, number ] = [ 0, 100, 50 ];
			const green: [ number, number, number ] = [ 120, 100, 50 ];
			const distance = getColorDistance( red, green );
			expect( distance ).toBeCloseTo( 240, 0 ); // 120° hue difference * 2 weight
		} );

		it( 'handles circular hue differences correctly', () => {
			const red1: [ number, number, number ] = [ 0, 100, 50 ];
			const red2: [ number, number, number ] = [ 350, 100, 50 ];
			const distance = getColorDistance( red1, red2 );
			// Should use the shorter path: 10° instead of 350°
			expect( distance ).toBeCloseTo( 20, 0 ); // 10° * 2 weight
		} );

		it( 'calculates maximum hue difference correctly', () => {
			const red: [ number, number, number ] = [ 0, 100, 50 ];
			const cyan: [ number, number, number ] = [ 180, 100, 50 ];
			const distance = getColorDistance( red, cyan );
			expect( distance ).toBeCloseTo( 360, 0 ); // 180° * 2 weight
		} );
	} );

	describe( 'Lightness differences', () => {
		it( 'calculates distance for colors with different lightness', () => {
			const dark: [ number, number, number ] = [ 120, 50, 20 ];
			const light: [ number, number, number ] = [ 120, 50, 80 ];
			const distance = getColorDistance( dark, light );
			expect( distance ).toBeCloseTo( 60, 0 ); // 60% lightness difference * 1 weight
		} );

		it( 'calculates maximum lightness difference', () => {
			const black: [ number, number, number ] = [ 0, 0, 0 ];
			const white: [ number, number, number ] = [ 0, 0, 100 ];
			const distance = getColorDistance( black, white );
			expect( distance ).toBeCloseTo( 100, 0 ); // 100% lightness difference * 1 weight
		} );
	} );

	describe( 'Saturation differences', () => {
		it( 'calculates distance for colors with different saturation', () => {
			const dull: [ number, number, number ] = [ 120, 20, 50 ];
			const vivid: [ number, number, number ] = [ 120, 80, 50 ];
			const distance = getColorDistance( dull, vivid );
			expect( distance ).toBeCloseTo( 30, 0 ); // 60% saturation difference * 0.5 weight
		} );

		it( 'calculates maximum saturation difference', () => {
			const gray: [ number, number, number ] = [ 120, 0, 50 ];
			const vivid: [ number, number, number ] = [ 120, 100, 50 ];
			const distance = getColorDistance( gray, vivid );
			expect( distance ).toBeCloseTo( 50, 0 ); // 100% saturation difference * 0.5 weight
		} );
	} );

	describe( 'Combined differences', () => {
		it( 'calculates distance with all components different', () => {
			const color1: [ number, number, number ] = [ 0, 100, 25 ]; // Dark red
			const color2: [ number, number, number ] = [ 180, 50, 75 ]; // Light cyan
			const distance = getColorDistance( color1, color2 );

			// Expected calculation:
			// Hue: 180° * 2 = 360
			// Lightness: 50% * 1 = 50
			// Saturation: 50% * 0.5 = 25
			// Distance = sqrt(360² + 50² + 25²) ≈ 364.3
			expect( distance ).toBeCloseTo( 364.3, 1 );
		} );

		it( 'weights hue differences more heavily than others', () => {
			const baseColor: [ number, number, number ] = [ 0, 50, 50 ];

			// Same hue difference, different component changes
			const hueChange: [ number, number, number ] = [ 30, 50, 50 ]; // +30° hue
			const lightnessChange: [ number, number, number ] = [ 0, 50, 80 ]; // +30% lightness
			const saturationChange: [ number, number, number ] = [ 0, 80, 50 ]; // +30% saturation

			const hueDistance = getColorDistance( baseColor, hueChange );
			const lightnessDistance = getColorDistance( baseColor, lightnessChange );
			const saturationDistance = getColorDistance( baseColor, saturationChange );

			// Hue should have the largest impact
			expect( hueDistance ).toBeGreaterThan( lightnessDistance );
			expect( hueDistance ).toBeGreaterThan( saturationDistance );
			expect( lightnessDistance ).toBeGreaterThan( saturationDistance );
		} );
	} );

	describe( 'Real-world color comparisons', () => {
		it( 'calculates distance between similar blues', () => {
			const blue1 = hexToHsl( '#4f46e5' ); // Primary blue
			const blue2 = hexToHsl( '#3b82f6' ); // Sky blue
			const distance = getColorDistance( blue1, blue2 );

			// Should be relatively small since both are blue
			expect( distance ).toBeLessThan( 100 );
			expect( distance ).toBeGreaterThan( 0 );
		} );

		it( 'calculates distance between complementary colors', () => {
			const red = hexToHsl( '#ef4444' );
			const green = hexToHsl( '#10b981' );
			const distance = getColorDistance( red, green );

			// Should be large since they're complementary
			expect( distance ).toBeGreaterThan( 200 );
		} );

		it( 'calculates distance between different shades of same hue', () => {
			const lightBlue = hexToHsl( '#bfdbfe' );
			const darkBlue = hexToHsl( '#1e40af' );
			const distance = getColorDistance( lightBlue, darkBlue );

			// Should be moderate - same hue but different lightness
			expect( distance ).toBeGreaterThan( 50 );
			expect( distance ).toBeLessThan( 150 );
		} );
	} );

	describe( 'Edge cases', () => {
		it( 'handles extreme hue values correctly', () => {
			const color1: [ number, number, number ] = [ 359, 50, 50 ];
			const color2: [ number, number, number ] = [ 1, 50, 50 ];
			const distance = getColorDistance( color1, color2 );
			// Should use shorter circular distance: 2° not 358°
			expect( distance ).toBeCloseTo( 4, 0 ); // 2° * 2 weight
		} );

		it( 'handles zero values correctly', () => {
			const color1: [ number, number, number ] = [ 0, 0, 0 ];
			const color2: [ number, number, number ] = [ 1, 1, 1 ];
			const distance = getColorDistance( color1, color2 );
			expect( distance ).toBeCloseTo( 2.29, 1 ); // sqrt(2² + 1² + 0.5²)
		} );

		it( 'returns positive distance values', () => {
			const color1: [ number, number, number ] = [ 100, 80, 30 ];
			const color2: [ number, number, number ] = [ 200, 20, 70 ];
			const distance = getColorDistance( color1, color2 );
			expect( distance ).toBeGreaterThan( 0 );
		} );
	} );
} );

describe( 'lightenHexColor', () => {
	describe( 'Valid inputs', () => {
		it( 'returns original color with blend of 0', () => {
			const result = lightenHexColor( '#ff0000', 0 );
			expect( result ).toBe( '#ff0000' );
		} );

		it( 'returns white with blend of 1', () => {
			const result = lightenHexColor( '#ff0000', 1 );
			expect( result ).toBe( '#ffffff' );
		} );

		it( 'lightens red by 50%', () => {
			const result = lightenHexColor( '#ff0000', 0.5 );
			expect( result ).toBe( '#ff8080' );
		} );

		it( 'lightens blue by 50%', () => {
			const result = lightenHexColor( '#0000ff', 0.5 );
			expect( result ).toBe( '#8080ff' );
		} );

		it( 'lightens a theme color by 80%', () => {
			const result = lightenHexColor( '#98C8DF', 0.8 );
			// R: 152 + (255-152)*0.8 = 152 + 82.4 = 234
			// G: 200 + (255-200)*0.8 = 200 + 44 = 244
			// B: 223 + (255-223)*0.8 = 223 + 25.6 = 249
			expect( result ).toBe( '#eaf4f9' );
		} );

		it( 'handles black color', () => {
			const result = lightenHexColor( '#000000', 0.5 );
			expect( result ).toBe( '#808080' );
		} );

		it( 'handles white color (stays white)', () => {
			const result = lightenHexColor( '#ffffff', 0.5 );
			expect( result ).toBe( '#ffffff' );
		} );

		it( 'handles lowercase hex', () => {
			const result = lightenHexColor( '#abcdef', 0.5 );
			expect( result.toLowerCase() ).toMatch( /^#[0-9a-f]{6}$/ );
		} );
	} );

	describe( 'Invalid inputs', () => {
		it( 'throws for hex without hash', () => {
			expect( () => lightenHexColor( 'ff0000', 0.5 ) ).toThrow();
		} );

		it( 'throws for short hex', () => {
			expect( () => lightenHexColor( '#fff', 0.5 ) ).toThrow();
		} );

		it( 'throws for invalid hex characters', () => {
			expect( () => lightenHexColor( '#gggggg', 0.5 ) ).toThrow();
		} );
	} );
} );
