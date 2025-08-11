/**
 * @jest-environment jsdom
 */
import { ChartTheme } from '../../types';
import { getSeriesLineStyles, getSeriesStroke, getSeriesStyles } from '../get-styles';

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

	describe( 'getSeriesStyles', () => {
		it( 'returns both stroke and line styles', () => {
			const comparisonSeries = {
				...mockSeriesData,
				options: {
					type: 'comparison' as const,
					stroke: '#PURPLE',
				},
			};

			const result = getSeriesStyles( comparisonSeries, 0, mockTheme as ChartTheme );

			expect( result ).toEqual( {
				stroke: '#PURPLE',
				lineStyles: {
					strokeDasharray: '4 4',
					strokeLinecap: 'square',
					strokeWidth: 1.5,
				},
			} );
		} );

		it( 'handles series with no special options', () => {
			const result = getSeriesStyles( mockSeriesData, 0, mockTheme as ChartTheme );

			expect( result ).toEqual( {
				stroke: '#FF0000', // First theme color
				lineStyles: { strokeWidth: 2 }, // First default series style
			} );
		} );

		it( 'combines all styling logic correctly for complex case', () => {
			const complexSeries = {
				...mockSeriesData,
				options: {
					type: 'comparison' as const,
					stroke: '#COMPLEX',
					seriesLineStyle: { strokeWidth: 99 }, // Should override comparison styles
				},
			};

			const result = getSeriesStyles( complexSeries, 1, mockTheme as ChartTheme );

			expect( result ).toEqual( {
				stroke: '#COMPLEX',
				lineStyles: { strokeWidth: 99 }, // Custom style wins
			} );
		} );
	} );
} );
