import {
	hexToHsl,
	hslToHex,
	getColorDistance,
	lightenHexColor,
	isValidHexColor,
	validateHexColor,
	parseHslString,
	parseRgbString,
	normalizeColorToHex,
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

describe( 'hslToHex', () => {
	describe( 'Basic colors', () => {
		it( 'converts red (0, 100, 50) to #ff0000', () => {
			expect( hslToHex( [ 0, 100, 50 ] ) ).toBe( '#ff0000' );
		} );

		it( 'converts green (120, 100, 50) to #00ff00', () => {
			expect( hslToHex( [ 120, 100, 50 ] ) ).toBe( '#00ff00' );
		} );

		it( 'converts blue (240, 100, 50) to #0000ff', () => {
			expect( hslToHex( [ 240, 100, 50 ] ) ).toBe( '#0000ff' );
		} );

		it( 'converts black (0, 0, 0) to #000000', () => {
			expect( hslToHex( [ 0, 0, 0 ] ) ).toBe( '#000000' );
		} );

		it( 'converts white (0, 0, 100) to #ffffff', () => {
			expect( hslToHex( [ 0, 0, 100 ] ) ).toBe( '#ffffff' );
		} );
	} );

	describe( 'Grayscale (zero saturation)', () => {
		it( 'converts 50% gray to #808080', () => {
			expect( hslToHex( [ 0, 0, 50 ] ) ).toBe( '#808080' );
		} );

		it( 'converts 25% gray to #404040', () => {
			expect( hslToHex( [ 0, 0, 25 ] ) ).toBe( '#404040' );
		} );

		it( 'converts 75% gray to #bfbfbf', () => {
			expect( hslToHex( [ 0, 0, 75 ] ) ).toBe( '#bfbfbf' );
		} );
	} );

	describe( 'Various hues and saturations', () => {
		it( 'converts orange (30, 100, 50) correctly', () => {
			expect( hslToHex( [ 30, 100, 50 ] ) ).toBe( '#ff8000' );
		} );

		it( 'converts cyan (180, 100, 50) correctly', () => {
			expect( hslToHex( [ 180, 100, 50 ] ) ).toBe( '#00ffff' );
		} );

		it( 'handles low saturation', () => {
			const result = hslToHex( [ 0, 10, 50 ] );
			expect( result ).toMatch( /^#[0-9a-f]{6}$/ );
		} );
	} );

	describe( 'Round-trip with hexToHsl', () => {
		it( 'round-trips red correctly', () => {
			const hsl = hexToHsl( '#ff0000' );
			const hex = hslToHex( hsl );
			expect( hex ).toBe( '#ff0000' );
		} );

		it( 'round-trips blue correctly', () => {
			const hsl = hexToHsl( '#0000ff' );
			const hex = hslToHex( hsl );
			expect( hex ).toBe( '#0000ff' );
		} );

		it( 'round-trips a complex color correctly', () => {
			const hsl = hexToHsl( '#98c8df' );
			const hex = hslToHex( hsl );
			// Allow for minor rounding differences
			expect( hex.toLowerCase() ).toMatch( /^#[0-9a-f]{6}$/ );
		} );
	} );
} );

describe( 'parseHslString', () => {
	describe( 'Valid HSL strings', () => {
		it( 'parses hsl(120, 50%, 50%)', () => {
			expect( parseHslString( 'hsl(120, 50%, 50%)' ) ).toEqual( [ 120, 50, 50 ] );
		} );

		it( 'parses hsl with no spaces', () => {
			expect( parseHslString( 'hsl(180,100%,25%)' ) ).toEqual( [ 180, 100, 25 ] );
		} );

		it( 'parses hsl with extra spaces', () => {
			expect( parseHslString( 'hsl(  90 ,  75%  ,  60%  )' ) ).toEqual( [ 90, 75, 60 ] );
		} );

		it( 'parses hsl without percent signs', () => {
			expect( parseHslString( 'hsl(45, 50, 50)' ) ).toEqual( [ 45, 50, 50 ] );
		} );

		it( 'handles negative hue values', () => {
			const result = parseHslString( 'hsl(-30, 50%, 50%)' );
			expect( result ).toEqual( [ 330, 50, 50 ] );
		} );

		it( 'handles hue > 360', () => {
			const result = parseHslString( 'hsl(390, 50%, 50%)' );
			expect( result ).toEqual( [ 30, 50, 50 ] );
		} );

		it( 'parses decimal values', () => {
			expect( parseHslString( 'hsl(120.5, 50.5%, 50.5%)' ) ).toEqual( [ 120.5, 50.5, 50.5 ] );
		} );
	} );

	describe( 'Invalid HSL strings', () => {
		it( 'returns null for rgb strings', () => {
			expect( parseHslString( 'rgb(255, 0, 0)' ) ).toBeNull();
		} );

		it( 'returns null for hex colors', () => {
			expect( parseHslString( '#ff0000' ) ).toBeNull();
		} );

		it( 'returns null for invalid format', () => {
			expect( parseHslString( 'hsl(abc, def, ghi)' ) ).toBeNull();
		} );

		it( 'returns null for empty string', () => {
			expect( parseHslString( '' ) ).toBeNull();
		} );
	} );
} );

describe( 'parseRgbString', () => {
	describe( 'Valid RGB strings', () => {
		it( 'parses rgb(255, 0, 0) to #ff0000', () => {
			expect( parseRgbString( 'rgb(255, 0, 0)' ) ).toBe( '#ff0000' );
		} );

		it( 'parses rgb(0, 255, 0) to #00ff00', () => {
			expect( parseRgbString( 'rgb(0, 255, 0)' ) ).toBe( '#00ff00' );
		} );

		it( 'parses rgb(0, 0, 255) to #0000ff', () => {
			expect( parseRgbString( 'rgb(0, 0, 255)' ) ).toBe( '#0000ff' );
		} );

		it( 'parses rgb with no spaces', () => {
			expect( parseRgbString( 'rgb(128,128,128)' ) ).toBe( '#808080' );
		} );

		it( 'clamps values above 255', () => {
			expect( parseRgbString( 'rgb(300, 0, 0)' ) ).toBe( '#ff0000' );
		} );

		it( 'clamps negative values to 0', () => {
			expect( parseRgbString( 'rgb(-50, 0, 0)' ) ).toBe( '#000000' );
		} );
	} );

	describe( 'Invalid RGB strings', () => {
		it( 'returns null for hsl strings', () => {
			expect( parseRgbString( 'hsl(0, 100%, 50%)' ) ).toBeNull();
		} );

		it( 'returns null for hex colors', () => {
			expect( parseRgbString( '#ff0000' ) ).toBeNull();
		} );

		it( 'returns null for rgba strings', () => {
			expect( parseRgbString( 'rgba(255, 0, 0, 1)' ) ).toBeNull();
		} );

		it( 'returns null for empty string', () => {
			expect( parseRgbString( '' ) ).toBeNull();
		} );
	} );
} );

describe( 'normalizeColorToHex', () => {
	describe( 'Hex colors', () => {
		it( 'returns valid 6-digit hex as-is', () => {
			expect( normalizeColorToHex( '#ff0000' ) ).toBe( '#ff0000' );
		} );

		it( 'returns uppercase hex as-is', () => {
			expect( normalizeColorToHex( '#FF0000' ) ).toBe( '#FF0000' );
		} );

		it( 'expands 3-digit hex to 6-digit', () => {
			expect( normalizeColorToHex( '#abc' ) ).toBe( '#aabbcc' );
		} );

		it( 'expands 3-digit uppercase hex', () => {
			expect( normalizeColorToHex( '#FFF' ) ).toBe( '#ffffff' );
		} );
	} );

	describe( 'HSL strings', () => {
		it( 'converts hsl(0, 100%, 50%) to #ff0000', () => {
			expect( normalizeColorToHex( 'hsl(0, 100%, 50%)' ) ).toBe( '#ff0000' );
		} );

		it( 'converts hsl(120, 100%, 50%) to #00ff00', () => {
			expect( normalizeColorToHex( 'hsl(120, 100%, 50%)' ) ).toBe( '#00ff00' );
		} );

		it( 'converts hsl(240, 100%, 50%) to #0000ff', () => {
			expect( normalizeColorToHex( 'hsl(240, 100%, 50%)' ) ).toBe( '#0000ff' );
		} );
	} );

	describe( 'RGB strings', () => {
		it( 'converts rgb(255, 0, 0) to #ff0000', () => {
			expect( normalizeColorToHex( 'rgb(255, 0, 0)' ) ).toBe( '#ff0000' );
		} );

		it( 'converts rgb(0, 128, 0) to #008000', () => {
			expect( normalizeColorToHex( 'rgb(0, 128, 0)' ) ).toBe( '#008000' );
		} );
	} );

	describe( 'CSS variables', () => {
		it( 'returns original if no resolveCss function provided', () => {
			expect( normalizeColorToHex( '--my-color' ) ).toBe( '--my-color' );
		} );

		it( 'returns original for var() if no resolveCss function provided', () => {
			expect( normalizeColorToHex( 'var(--my-color)' ) ).toBe( 'var(--my-color)' );
		} );

		it( 'resolves CSS variable using provided function', () => {
			const mockResolve = jest.fn().mockReturnValue( '#ff0000' );
			expect( normalizeColorToHex( '--my-color', null, mockResolve ) ).toBe( '#ff0000' );
			expect( mockResolve ).toHaveBeenCalledWith( '--my-color', null );
		} );

		it( 'resolves var() syntax using provided function', () => {
			const mockResolve = jest.fn().mockReturnValue( '#00ff00' );
			expect( normalizeColorToHex( 'var(--my-color)', null, mockResolve ) ).toBe( '#00ff00' );
		} );

		it( 'recursively normalizes resolved CSS variable values', () => {
			const mockResolve = jest.fn().mockReturnValue( 'hsl(120, 100%, 50%)' );
			expect( normalizeColorToHex( '--my-color', null, mockResolve ) ).toBe( '#00ff00' );
		} );

		it( 'returns original if CSS variable cannot be resolved', () => {
			const mockResolve = jest.fn().mockReturnValue( null );
			expect( normalizeColorToHex( '--my-color', null, mockResolve ) ).toBe( '--my-color' );
		} );
	} );

	describe( 'Invalid inputs', () => {
		it( 'returns original for unknown color formats', () => {
			expect( normalizeColorToHex( 'unknown-color' ) ).toBe( 'unknown-color' );
		} );

		it( 'handles empty string', () => {
			expect( normalizeColorToHex( '' ) ).toBe( '' );
		} );

		it( 'handles invalid HSL string', () => {
			expect( normalizeColorToHex( 'hsl(abc, def, ghi)' ) ).toBe( 'hsl(abc, def, ghi)' );
		} );
	} );
} );
