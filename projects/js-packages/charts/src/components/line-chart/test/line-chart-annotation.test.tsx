/**
 * @jest-environment jsdom
 */

import { getLabelPosition } from '../line-chart-annotation';

describe( 'LineChartAnnotation', () => {
	describe( 'getLabelPosition', () => {
		const defaultParams: Parameters< typeof getLabelPosition >[ 0 ] = {
			subjectType: 'circle',
			x: 100,
			xMax: 500,
			y: 200,
			yMin: 400, // Bottom of chart (larger y value)
			yMax: 0, // Top of chart (smaller y value)
		};

		describe( 'Default positioning', () => {
			test( 'returns default position for circle subject type', () => {
				const result = getLabelPosition( {
					...defaultParams,
				} );

				expect( result ).toEqual( {
					dx: 15,
					dy: 15,
					isFlippedHorizontally: false,
					isFlippedVertically: false,
				} );
			} );

			test( 'returns correct position for line-horizontal subject type', () => {
				const result = getLabelPosition( {
					...defaultParams,
					subjectType: 'line-horizontal',
				} );

				expect( result ).toEqual( {
					dx: 0,
					dy: 20,
					isFlippedHorizontally: false,
					isFlippedVertically: false,
				} );
			} );

			test( 'returns correct position for line-vertical subject type', () => {
				const result = getLabelPosition( {
					...defaultParams,
					subjectType: 'line-vertical',
				} );

				expect( result ).toEqual( {
					dx: 20,
					dy: 0,
					isFlippedHorizontally: false,
					isFlippedVertically: false,
				} );
			} );
		} );

		describe( 'Horizontal boundary detection', () => {
			test( 'flips circle annotation horizontally when exceeding right boundary', () => {
				const result = getLabelPosition( {
					...defaultParams,
					x: 450, // Close to right edge (xMax: 500, default maxWidth: 125)
				} );

				expect( result ).toEqual( {
					dx: -15, // Flipped to negative
					dy: 15,
					isFlippedHorizontally: true,
					isFlippedVertically: false,
				} );
			} );

			test( 'flips line-vertical annotation horizontally when exceeding right boundary', () => {
				const result = getLabelPosition( {
					...defaultParams,
					subjectType: 'line-vertical',
					x: 450, // Close to right edge
				} );

				expect( result ).toEqual( {
					dx: -20, // Flipped to negative
					dy: 0,
					isFlippedHorizontally: true,
					isFlippedVertically: false,
				} );
			} );

			test( 'flips line-horizontal annotation horizontally when exceeding right boundary', () => {
				const result = getLabelPosition( {
					...defaultParams,
					subjectType: 'line-horizontal',
					x: 450, // Close to right edge
				} );

				expect( result ).toEqual( {
					dx: 0, // Unchanged
					dy: 20,
					isFlippedHorizontally: true,
					isFlippedVertically: false,
				} );
			} );

			test( 'uses custom maxWidth for boundary calculation', () => {
				const result = getLabelPosition( {
					...defaultParams,
					x: 350, // Would not flip with default maxWidth (125), but will with custom (200)
					maxWidth: 200,
				} );

				expect( result ).toEqual( {
					dx: -15,
					dy: 15,
					isFlippedHorizontally: true,
					isFlippedVertically: false,
				} );
			} );
		} );

		describe( 'Vertical boundary detection', () => {
			test( 'flips circle annotation vertically when too close to bottom edge', () => {
				const result = getLabelPosition( {
					...defaultParams,
					y: 350, // Close to bottom (yMin: 400, default height: 100)
				} );

				expect( result ).toEqual( {
					dx: 15,
					dy: -15, // Negative to position above
					isFlippedHorizontally: false,
					isFlippedVertically: true,
				} );
			} );

			test( 'flips line-horizontal annotation vertically when too close to top edge', () => {
				const result = getLabelPosition( {
					...defaultParams,
					subjectType: 'line-horizontal',
					y: 50,
				} );

				expect( result ).toEqual( {
					dx: 0,
					dy: 20, // Positive to position below
					isFlippedHorizontally: false,
					isFlippedVertically: true,
				} );
			} );

			test( 'flips line-horizontal annotation vertically when too close to bottom edge', () => {
				const result = getLabelPosition( {
					...defaultParams,
					subjectType: 'line-horizontal',
					y: 350,
				} );

				expect( result ).toEqual( {
					dx: 0,
					dy: -20, // Negative to position above
					isFlippedHorizontally: false,
					isFlippedVertically: true,
				} );
			} );

			test( 'flips line-vertical annotation vertically when too close to top edge', () => {
				const result = getLabelPosition( {
					...defaultParams,
					subjectType: 'line-vertical',
					y: 50,
				} );

				expect( result ).toEqual( {
					dx: 20,
					dy: 0, // Unchanged for line-vertical
					isFlippedHorizontally: false,
					isFlippedVertically: true,
				} );
			} );

			test( 'flips line-vertical annotation vertically when too close to bottom edge', () => {
				const result = getLabelPosition( {
					...defaultParams,
					subjectType: 'line-vertical',
					y: 350,
				} );

				expect( result ).toEqual( {
					dx: 20,
					dy: 0, // Unchanged for line-vertical
					isFlippedHorizontally: false,
					isFlippedVertically: true,
				} );
			} );

			test( 'uses custom height for boundary calculation', () => {
				const result = getLabelPosition( {
					...defaultParams,
					y: 250, // Would not flip with default height (100), but will with custom (200)
					height: 200, // 250 + 15 + 200 = 465 > 400 (yMin), so should flip
				} );

				expect( result ).toEqual( {
					dx: 15,
					dy: -15, // Flipped to position above
					isFlippedHorizontally: false,
					isFlippedVertically: true,
				} );
			} );

			test( 'handles null height by using default', () => {
				const result = getLabelPosition( {
					...defaultParams,
					y: 320, // Should flip with default height (320 + 15 + 100 = 435 > 400)
					height: null,
				} );

				expect( result ).toEqual( {
					dx: 15,
					dy: -15, // Flipped to position above
					isFlippedHorizontally: false,
					isFlippedVertically: true,
				} );
			} );
		} );

		describe( 'Combined boundary scenarios', () => {
			test( 'flips horizontally but not vertically when near top-right corner', () => {
				const result = getLabelPosition( {
					...defaultParams,
					x: 450, // Close to right edge
					y: 50, // Close to top edge
				} );

				expect( result ).toEqual( {
					dx: -15, // Flipped horizontally
					dy: 15, // Not flipped vertically (stays below)
					isFlippedHorizontally: true,
					isFlippedVertically: false, // No vertical flip needed for top edge
				} );
			} );

			test( 'handles bottom-right corner positioning', () => {
				const result = getLabelPosition( {
					...defaultParams,
					x: 450, // Close to right edge
					y: 350, // Close to bottom edge
				} );

				expect( result ).toEqual( {
					dx: -15,
					dy: -15,
					isFlippedHorizontally: true,
					isFlippedVertically: true,
				} );
			} );
		} );

		describe( 'Edge cases', () => {
			test( 'handles exact boundary positions', () => {
				const result = getLabelPosition( {
					...defaultParams,
					x: 360, // Exactly at boundary (500 - 15 - 125 = 360, accounting for dx offset)
				} );

				expect( result ).toEqual( {
					dx: 15, // Should not flip at exact boundary
					dy: 15,
					isFlippedHorizontally: false,
					isFlippedVertically: false,
				} );
			} );

			test( 'handles zero dimensions', () => {
				const result = getLabelPosition( {
					...defaultParams,
					maxWidth: 0,
					height: 0,
				} );

				expect( result ).toEqual( {
					dx: 15,
					dy: 15,
					isFlippedHorizontally: false,
					isFlippedVertically: false,
				} );
			} );

			test( 'handles very small chart dimensions', () => {
				const result = getLabelPosition( {
					...defaultParams,
					x: 50,
					xMax: 100,
					y: 50,
					yMin: 100,
					yMax: 0,
				} );

				// Should flip horizontally due to small chart width
				expect( result.isFlippedHorizontally ).toBe( true );
				expect( result.dx ).toBe( -15 );
			} );
		} );
	} );
} );
