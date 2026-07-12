import { hsl as d3Hsl } from '@visx/vendor/d3-color';
import {
	getColorDistance,
	lightenHexColor,
	mixHexColors,
	isValidHexColor,
	hexToRgba,
	validateHexColor,
	parseHslString,
	parseRgbString,
	normalizeColorToHex,
	relativeLuminance,
	prefersLightText,
} from '../color-utils';

// Helper to convert hex to HSL tuple using d3-color
const hexToHsl = ( hex: string ): [ number, number, number ] => {
	const hsl = d3Hsl( hex );
	return [ hsl.h, hsl.s * 100, hsl.l * 100 ];
};

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

describe( 'hexToRgba', () => {
	describe( 'Valid hex colors', () => {
		it( 'converts 6-digit hex to rgb with full opacity', () => {
			const result = hexToRgba( '#ff0000', 1 );
			expect( result ).toBe( 'rgb(255, 0, 0)' );
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
			expect( result ).toBe( 'rgb(0, 0, 0)' );
		} );

		it( 'handles white color', () => {
			const result = hexToRgba( '#ffffff', 1 );
			expect( result ).toBe( 'rgb(255, 255, 255)' );
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

			it( 'accepts negative and greater than 1 alpha values without throwing (d3 color formatRgb() clamps them)', () => {
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

		it( 'handles alpha value of 1 (returns rgb format)', () => {
			const result = hexToRgba( '#ff0000', 1 );
			expect( result ).toBe( 'rgb(255, 0, 0)' );
		} );

		it( 'clamps negative alpha values to 0', () => {
			const result = hexToRgba( '#ff0000', -0.5 );
			expect( result ).toBe( 'rgba(255, 0, 0, 0)' );
		} );

		it( 'clamps alpha values greater than 1 (returns rgb format)', () => {
			const result = hexToRgba( '#ff0000', 1.5 );
			expect( result ).toBe( 'rgb(255, 0, 0)' );
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
			expect( result ).toBe( 'rgb(138, 43, 226)' );
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

describe( 'mixHexColors', () => {
	it( 'returns the from color at blend 0', () => {
		expect( mixHexColors( '#ff0000', '#0000ff', 0 ) ).toBe( '#ff0000' );
	} );

	it( 'returns the to color at blend 1', () => {
		expect( mixHexColors( '#ff0000', '#0000ff', 1 ) ).toBe( '#0000ff' );
	} );

	it( 'blends halfway between the two colors', () => {
		expect( mixHexColors( '#000000', '#ffffff', 0.5 ) ).toBe( '#808080' );
	} );

	it( 'matches lightenHexColor when the target is white', () => {
		expect( mixHexColors( '#98c8df', '#ffffff', 0.8 ) ).toBe( lightenHexColor( '#98c8df', 0.8 ) );
	} );

	it( 'clamps blend outside [0, 1]', () => {
		expect( mixHexColors( '#123456', '#abcdef', -1 ) ).toBe( '#123456' );
		expect( mixHexColors( '#123456', '#abcdef', 2 ) ).toBe( '#abcdef' );
	} );

	it( 'throws on a malformed hex', () => {
		expect( () => mixHexColors( '#fff', '#000000', 0.5 ) ).toThrow();
		expect( () => mixHexColors( '#000000', 'nope', 0.5 ) ).toThrow();
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

		it( 'requires percent signs for s and l (CSS spec)', () => {
			// d3-color follows CSS spec which requires % for saturation and lightness
			expect( parseHslString( 'hsl(45, 50, 50)' ) ).toBeNull();
			expect( parseHslString( 'hsl(45, 50%, 50%)' ) ).toEqual( [ 45, 50, 50 ] );
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

	describe( 'HSLA strings', () => {
		it( 'converts hsla(0, 100%, 50%, 1) to #ff0000', () => {
			expect( normalizeColorToHex( 'hsla(0, 100%, 50%, 1)' ) ).toBe( '#ff0000' );
		} );

		it( 'converts hsla(120, 100%, 50%, 0.5) to #00ff00', () => {
			expect( normalizeColorToHex( 'hsla(120, 100%, 50%, 0.5)' ) ).toBe( '#00ff00' );
		} );

		it( 'converts fully transparent hsla to #000000', () => {
			// d3-color converts fully transparent colors (alpha=0) to black
			expect( normalizeColorToHex( 'hsla(240, 100%, 50%, 0)' ) ).toBe( '#000000' );
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

	describe( 'RGBA strings', () => {
		it( 'converts rgba(255, 0, 0, 1) to #ff0000', () => {
			expect( normalizeColorToHex( 'rgba(255, 0, 0, 1)' ) ).toBe( '#ff0000' );
		} );

		it( 'converts rgba(0, 0, 255, 0.5) to #0000ff', () => {
			// Alpha channel is stripped in hex conversion
			expect( normalizeColorToHex( 'rgba(0, 0, 255, 0.5)' ) ).toBe( '#0000ff' );
		} );

		it( 'converts fully transparent rgba to #000000', () => {
			// d3-color converts fully transparent colors (alpha=0) to black
			expect( normalizeColorToHex( 'rgba(128, 128, 128, 0)' ) ).toBe( '#000000' );
		} );
	} );

	describe( 'Named CSS colors', () => {
		it( 'converts steelblue to hex', () => {
			expect( normalizeColorToHex( 'steelblue' ) ).toBe( '#4682b4' );
		} );

		it( 'converts red to hex', () => {
			expect( normalizeColorToHex( 'red' ) ).toBe( '#ff0000' );
		} );

		it( 'returns unknown strings as-is', () => {
			expect( normalizeColorToHex( 'notacolor' ) ).toBe( 'notacolor' );
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

		it( 'returns original when CSS variable resolves to itself', () => {
			const mockResolve = jest.fn().mockImplementation( ( v: string ) => v );
			expect( normalizeColorToHex( '--loop', null, mockResolve ) ).toBe( '--loop' );
		} );

		it( 'returns original when CSS variable resolves to empty string', () => {
			const mockResolve = jest.fn().mockReturnValue( '' );
			expect( normalizeColorToHex( '--empty', null, mockResolve ) ).toBe( '--empty' );
		} );

		it( 'does not infinite loop on indirect CSS variable cycle', () => {
			const mockResolve = jest.fn().mockImplementation( ( v: string ) => {
				if ( v === '--a' ) return 'var(--b)';
				if ( v === 'var(--b)' ) return '--a';

				return null;
			} );

			expect( () => normalizeColorToHex( '--a', null, mockResolve ) ).not.toThrow();
		} );

		it( 'resolves multi-hop CSS variable chain', () => {
			const mockResolve = jest.fn().mockImplementation( ( v: string ) => {
				if ( v === '--a' ) return 'var(--b)';
				if ( v === 'var(--b)' ) return 'hsl(0, 100%, 50%)';

				return null;
			} );

			expect( normalizeColorToHex( '--a', null, mockResolve ) ).toBe( '#ff0000' );
		} );
	} );

	describe( 'Whitespace handling', () => {
		it( 'trims leading and trailing spaces from hex', () => {
			expect( normalizeColorToHex( '  #ff0000  ' ) ).toBe( '#ff0000' );
		} );

		it( 'trims spaces from HSL string', () => {
			expect( normalizeColorToHex( '  hsl(0, 100%, 50%)  ' ) ).toBe( '#ff0000' );
		} );

		it( 'trims spaces from named color', () => {
			expect( normalizeColorToHex( '  red  ' ) ).toBe( '#ff0000' );
		} );
	} );

	describe( 'Case insensitivity', () => {
		it( 'converts uppercase HSL', () => {
			expect( normalizeColorToHex( 'HSL(0, 100%, 50%)' ) ).toBe( '#ff0000' );
		} );

		it( 'converts uppercase RGB', () => {
			expect( normalizeColorToHex( 'RGB(255, 0, 0)' ) ).toBe( '#ff0000' );
		} );

		it( 'converts uppercase RGBA', () => {
			expect( normalizeColorToHex( 'RGBA(0, 0, 255, 1)' ) ).toBe( '#0000ff' );
		} );

		it( 'handles uppercase VAR() syntax', () => {
			const mockResolve = jest.fn().mockReturnValue( '#ff0000' );
			expect( normalizeColorToHex( 'VAR(--my-color)', null, mockResolve ) ).toBe( '#ff0000' );
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

describe( 'relativeLuminance', () => {
	it( 'returns 0 for black and 1 for white', () => {
		expect( relativeLuminance( '#000000' ) ).toBeCloseTo( 0, 5 );
		expect( relativeLuminance( '#ffffff' ) ).toBeCloseTo( 1, 5 );
	} );

	it( 'returns a higher luminance for a lighter color', () => {
		expect( relativeLuminance( '#98c8df' ) ).toBeGreaterThan( relativeLuminance( '#006dab' ) );
	} );

	it( 'throws on a malformed hex', () => {
		expect( () => relativeLuminance( 'not-a-color' ) ).toThrow();
	} );
} );

describe( 'prefersLightText', () => {
	it( 'prefers dark text on light backgrounds', () => {
		expect( prefersLightText( '#ffffff' ) ).toBe( false );
		expect( prefersLightText( '#98c8df' ) ).toBe( false );
	} );

	it( 'prefers light text on dark backgrounds', () => {
		expect( prefersLightText( '#000000' ) ).toBe( true );
		expect( prefersLightText( '#006dab' ) ).toBe( true );
	} );

	it( 'falls back to dark text for malformed colors', () => {
		expect( prefersLightText( 'var(--token)' ) ).toBe( false );
	} );
} );
