import { ChartTheme } from '../../types';
import {
	getSeriesBarStyles,
	getSeriesLineStyles,
	getSeriesStroke,
	getItemShapeStyles,
} from '../get-styles';

describe( 'Series styling utility functions', () => {
	const mockSeriesData = {
		label: 'Test Series',
		data: [],
		options: {},
	};

	const mockTheme: Partial< ChartTheme > = {
		colors: [ '#FF0000', '#00FF00', '#0000FF' ],
		lineChart: {
			lineStyles: {
				comparison: {
					strokeDasharray: '4 4',
					strokeLinecap: 'square' as const,
					strokeWidth: 1.5,
				},
			},
		},
		seriesLineStyles: [ { strokeWidth: 2 }, { strokeWidth: 3, strokeDasharray: '2 2' } ],
		legend: {
			shapeStyles: [
				{ fill: '#LEGEND1', stroke: '#BORDER1' },
				{ fill: '#LEGEND2', strokeWidth: 3 },
			],
		},
	};

	describe( 'getSeriesStroke', () => {
		it( 'returns custom stroke color when provided in series options', () => {
			const seriesWithStroke = {
				...mockSeriesData,
				options: { stroke: '#CUSTOM' },
			};

			const result = getSeriesStroke( seriesWithStroke, 0, mockTheme.colors );
			expect( result ).toBe( '#CUSTOM' );
		} );

		it( 'returns theme color by index when no custom stroke', () => {
			const result = getSeriesStroke( mockSeriesData, 1, mockTheme.colors );
			expect( result ).toBe( '#00FF00' ); // Second color
		} );

		it( 'wraps around theme colors when index exceeds array length', () => {
			const result = getSeriesStroke( mockSeriesData, 5, mockTheme.colors );
			expect( result ).toBe( '#0000FF' ); // 5 % 3 = 2, third color
		} );
	} );

	describe( 'getSeriesLineStyles', () => {
		it( 'returns custom seriesLineStyle when provided', () => {
			const customStyles = { strokeWidth: 5, strokeDasharray: '10 5' };
			const seriesWithCustomStyles = {
				...mockSeriesData,
				options: { seriesLineStyle: customStyles },
			};

			const result = getSeriesLineStyles( seriesWithCustomStyles, 0, mockTheme as ChartTheme );
			expect( result ).toEqual( customStyles );
		} );

		it( 'returns theme comparison styles when type is comparison', () => {
			const comparisonSeries = {
				...mockSeriesData,
				options: { type: 'comparison' as const },
			};

			const result = getSeriesLineStyles( comparisonSeries, 0, mockTheme as ChartTheme );
			expect( result ).toEqual( {
				strokeDasharray: '4 4',
				strokeLinecap: 'square',
				strokeWidth: 1.5,
			} );
		} );

		it( 'returns default theme series styles when no custom or comparison type', () => {
			const result = getSeriesLineStyles( mockSeriesData, 1, mockTheme as ChartTheme );
			expect( result ).toEqual( { strokeWidth: 3, strokeDasharray: '2 2' } );
		} );

		it( 'wraps around seriesLineStyles when index exceeds array length', () => {
			const result = getSeriesLineStyles( mockSeriesData, 3, mockTheme as ChartTheme );
			expect( result ).toEqual( { strokeWidth: 3, strokeDasharray: '2 2' } ); // 3 % 2 = 1, second style
		} );

		it( 'returns empty object when no styles available', () => {
			const themeWithoutStyles = { colors: [ '#FF0000' ] } as ChartTheme;
			const result = getSeriesLineStyles( mockSeriesData, 0, themeWithoutStyles );
			expect( result ).toEqual( {} );
		} );

		it( 'prioritizes custom styles over theme comparison styles', () => {
			const customStyles = { strokeWidth: 10 };
			const seriesWithBoth = {
				...mockSeriesData,
				options: {
					type: 'comparison' as const,
					seriesLineStyle: customStyles,
				},
			};

			const result = getSeriesLineStyles( seriesWithBoth, 0, mockTheme as ChartTheme );
			expect( result ).toEqual( customStyles );
		} );

		it( 'prioritizes theme comparison styles over default series styles', () => {
			const comparisonSeries = {
				...mockSeriesData,
				options: { type: 'comparison' as const },
			};

			const result = getSeriesLineStyles( comparisonSeries, 0, mockTheme as ChartTheme );
			expect( result ).toEqual( {
				strokeDasharray: '4 4',
				strokeLinecap: 'square',
				strokeWidth: 1.5,
			} );
		} );
	} );

	describe( 'getItemShapeStyles', () => {
		it( 'returns custom legendShapeStyle when provided in series options', () => {
			const customShapeStyle = { fill: '#CUSTOM', strokeWidth: 5 };
			const seriesWithShapeStyle = {
				...mockSeriesData,
				options: { legendShapeStyle: customShapeStyle },
			};

			const result = getItemShapeStyles( seriesWithShapeStyle, 0, mockTheme as ChartTheme, 'rect' );
			expect( result ).toEqual( customShapeStyle );
		} );

		it( 'combines line styles when legendShape is "line"', () => {
			const comparisonSeries = {
				...mockSeriesData,
				options: { type: 'comparison' as const },
			};

			const result = getItemShapeStyles( comparisonSeries, 0, mockTheme as ChartTheme, 'line' );
			expect( result ).toEqual( {
				strokeDasharray: '4 4',
				strokeLinecap: 'square',
				strokeWidth: 1.5,
			} );
		} );

		it( 'does not include line styles when legendShape is not "line"', () => {
			const comparisonSeries = {
				...mockSeriesData,
				options: { type: 'comparison' as const },
			};

			const result = getItemShapeStyles( comparisonSeries, 0, mockTheme as ChartTheme, 'rect' );
			expect( result ).toEqual( mockTheme.legend.shapeStyles[ 0 ] );
		} );

		it( 'applies the comparison bar opacity to the swatch for non-line legends', () => {
			const themeWithBar = {
				...mockTheme,
				barChart: { barStyles: { comparison: { widthFactor: 1.5, opacity: 0.5 } } },
				// No per-index legend shape styles, so the swatch reflects only the comparison opacity.
				legend: { shapeStyles: [] },
			} as ChartTheme;
			const comparisonSeries = {
				...mockSeriesData,
				options: { type: 'comparison' as const },
			};

			// rect (bar) legend: swatch picks up the comparison opacity to match the bar.
			const rectResult = getItemShapeStyles( comparisonSeries, 0, themeWithBar, 'rect' );
			expect( rectResult ).toEqual( { opacity: 0.5 } );

			// line legend: comparison is conveyed via the dashed stroke, not opacity.
			const lineResult = getItemShapeStyles( comparisonSeries, 0, themeWithBar, 'line' );
			expect( lineResult.opacity ).toBeUndefined();
			expect( lineResult ).toMatchObject( { strokeDasharray: '4 4' } );
		} );

		it( 'merges custom shape styles with line styles for line shape', () => {
			const customShapeStyle = { fill: '#CUSTOM' };
			const comparisonSeries = {
				...mockSeriesData,
				options: {
					type: 'comparison' as const,
					legendShapeStyle: customShapeStyle,
				},
			};

			const result = getItemShapeStyles( comparisonSeries, 0, mockTheme as ChartTheme, 'line' );
			expect( result ).toEqual( {
				fill: '#CUSTOM',
				strokeDasharray: '4 4',
				strokeLinecap: 'square',
				strokeWidth: 1.5,
			} );
		} );

		it( 'returns theme shape styles when no meaningful custom styles', () => {
			const seriesWithEmptyStyles = {
				...mockSeriesData,
				options: { legendShapeStyle: {} },
			};

			const result = getItemShapeStyles(
				seriesWithEmptyStyles,
				1,
				mockTheme as ChartTheme,
				'rect'
			);
			expect( result ).toEqual( mockTheme.legend.shapeStyles[ 1 ] );
		} );

		it( 'returns empty object when no theme shape styles and no meaningful custom styles', () => {
			const themeWithoutShapeStyles = {
				...mockTheme,
				legend: { shapeStyles: undefined },
			} as ChartTheme;

			const result = getItemShapeStyles( mockSeriesData, 0, themeWithoutShapeStyles, 'rect' );
			expect( result ).toEqual( {} );
		} );

		it( 'returns custom styles even with undefined/null values when meaningful values exist', () => {
			const seriesWithPartialStyles = {
				...mockSeriesData,
				options: {
					legendShapeStyle: {
						fill: '#VALID',
						stroke: '',
						strokeWidth: undefined,
						opacity: null,
					},
				},
			};

			const result = getItemShapeStyles(
				seriesWithPartialStyles,
				0,
				mockTheme as ChartTheme,
				'rect'
			);
			expect( result ).toEqual( {
				fill: '#VALID',
				stroke: '',
				strokeWidth: undefined,
				opacity: null,
			} );
		} );

		it( 'handles series with complex styling combinations where line styles override custom styles', () => {
			const complexSeries = {
				...mockSeriesData,
				options: {
					type: 'comparison' as const,
					legendShapeStyle: {
						fill: '#OVERRIDE',
						strokeWidth: 10, // Will be overridden by comparison line styles
					},
				},
			};

			const result = getItemShapeStyles( complexSeries, 0, mockTheme as ChartTheme, 'line' );
			expect( result ).toEqual( {
				fill: '#OVERRIDE',
				strokeWidth: 1.5, // Semantic style wins over custom style
				strokeDasharray: '4 4',
				strokeLinecap: 'square',
			} );
		} );

		it( 'returns empty object when index exceeds theme shape styles array length', () => {
			const result = getItemShapeStyles( mockSeriesData, 3, mockTheme as ChartTheme, 'rect' );
			expect( result ).toEqual( {} ); // index 3 doesn't exist in array of length 2
		} );

		it( 'works without legendShape parameter', () => {
			const result = getItemShapeStyles( mockSeriesData, 0, mockTheme as ChartTheme );
			expect( result ).toEqual( mockTheme.legend.shapeStyles[ 0 ] );
		} );

		it( 'handles other legendShape string values like "circle"', () => {
			const comparisonSeries = {
				...mockSeriesData,
				options: { type: 'comparison' as const },
			};

			const result = getItemShapeStyles( comparisonSeries, 0, mockTheme as ChartTheme, 'circle' );
			// Should not include line styles for circle shape
			expect( result ).toEqual( mockTheme.legend.shapeStyles[ 0 ] );
		} );

		it( 'handles React component as legendShape parameter', () => {
			const CustomShape = () => null;
			const comparisonSeries = {
				...mockSeriesData,
				options: { type: 'comparison' as const },
			};

			const result = getItemShapeStyles(
				comparisonSeries,
				0,
				mockTheme as ChartTheme,
				CustomShape
			);
			// Should not include line styles for component shape
			expect( result ).toEqual( mockTheme.legend.shapeStyles[ 0 ] );
		} );

		it( 'prioritizes series line styles over theme line styles when legendShape is line', () => {
			const seriesWithCustomLineStyle = {
				...mockSeriesData,
				options: {
					seriesLineStyle: { strokeWidth: 99, strokeDasharray: '10 10' },
				},
			};

			const result = getItemShapeStyles(
				seriesWithCustomLineStyle,
				0,
				mockTheme as ChartTheme,
				'line'
			);
			expect( result ).toEqual( {
				strokeWidth: 99,
				strokeDasharray: '10 10',
			} );
		} );

		it( 'handles empty object for legendShapeStyle with meaningful line styles', () => {
			const seriesWithEmptyShapeStyle = {
				...mockSeriesData,
				options: {
					type: 'comparison' as const,
					legendShapeStyle: {},
				},
			};

			const result = getItemShapeStyles(
				seriesWithEmptyShapeStyle,
				0,
				mockTheme as ChartTheme,
				'line'
			);
			// Should return line styles even though legendShapeStyle is empty
			expect( result ).toEqual( {
				strokeDasharray: '4 4',
				strokeLinecap: 'square',
				strokeWidth: 1.5,
			} );
		} );
	} );

	describe( 'getSeriesBarStyles', () => {
		const themeWithBar = {
			...mockTheme,
			barChart: { barStyles: { comparison: { widthFactor: 1.5, opacity: 0.5 } } },
		} as ChartTheme;

		it( 'returns comparison bar styles when type is comparison', () => {
			const comparisonSeries = { ...mockSeriesData, options: { type: 'comparison' as const } };
			expect( getSeriesBarStyles( comparisonSeries, 0, themeWithBar ) ).toEqual( {
				widthFactor: 1.5,
				opacity: 0.5,
			} );
		} );

		it( 'returns empty styles for a series with no type', () => {
			expect( getSeriesBarStyles( mockSeriesData, 0, themeWithBar ) ).toEqual( {} );
		} );
	} );
} );
