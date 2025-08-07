/**
 * @jest-environment jsdom
 */
import { getStringWidth } from '@visx/text';
import { ChartTheme } from '../../../types';
import {
	getLongestTickWidth,
	isSafari,
	getSeriesLineStyles,
	getSeriesStroke,
	getSeriesStyles,
} from '../utils';

jest.mock( '@visx/text', () => ( {
	getStringWidth: jest.fn(),
} ) );

describe( 'getLongestTickWidth', () => {
	beforeEach( () => {
		// Reset the mock before each test
		( getStringWidth as unknown as jest.Mock ).mockReset();
	} );

	it( 'returns the width of the longest formatted tick', () => {
		const ticks = [ 'a', 'bb', 'ccc' ];
		const formatTick = ( tick: string ) => tick;
		const labelStyle = { fontSize: 12 };
		// Mock getStringWidth to return the length of the string * 10
		( getStringWidth as unknown as jest.Mock ).mockImplementation(
			( str: string ) => str.length * 10
		);

		const result = getLongestTickWidth( ticks, formatTick, labelStyle );
		expect( result ).toBe( 30 ); // 'ccc' is the longest, 3*10 = 30
		// Ensure getStringWidth was called with 'ccc' and labelStyle
		expect( getStringWidth ).toHaveBeenCalledWith( 'ccc', labelStyle );
	} );

	it( 'uses the formatted tick values', () => {
		const ticks = [ 1, 22, 333 ];
		const formatTick = ( tick: number ) => `tick-${ tick }`;
		( getStringWidth as unknown as jest.Mock ).mockImplementation( ( str: string ) => str.length );

		const result = getLongestTickWidth( ticks, formatTick );
		// 'tick-333' is the longest (8 chars)
		expect( result ).toBe( 8 );
		// Ensure getStringWidth was called with 'tick-333'
		expect( getStringWidth ).toHaveBeenCalledWith( 'tick-333', undefined );
	} );
} );

describe( 'isSafari', () => {
	const originalNavigator = globalThis.navigator;

	afterEach( () => {
		// Restore original navigator after each test
		globalThis.navigator = originalNavigator;
	} );

	it( 'returns false when navigator is undefined', () => {
		// Simulate SSR environment where navigator is undefined
		Object.defineProperty( globalThis, 'navigator', {
			value: undefined,
			writable: true,
			configurable: true,
		} );

		const result = isSafari();
		expect( result ).toBe( false );
	} );

	it( 'returns false when navigator.userAgent is undefined', () => {
		// Mock navigator without userAgent
		globalThis.navigator = {} as Navigator;

		const result = isSafari();
		expect( result ).toBe( false );
	} );

	it( 'returns false when navigator.userAgent is empty string', () => {
		globalThis.navigator = { userAgent: '' } as Navigator;

		const result = isSafari();
		expect( result ).toBe( false );
	} );

	it( 'returns true for Safari user agent string', () => {
		globalThis.navigator = {
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
		} as Navigator;

		const result = isSafari();
		expect( result ).toBe( true );
	} );

	it( 'returns true for Safari iOS user agent string', () => {
		globalThis.navigator = {
			userAgent:
				'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
		} as Navigator;

		const result = isSafari();
		expect( result ).toBe( true );
	} );

	it( 'returns false for Chrome user agent string', () => {
		globalThis.navigator = {
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
		} as Navigator;

		const result = isSafari();
		expect( result ).toBe( false );
	} );

	it( 'returns false for Firefox user agent string', () => {
		globalThis.navigator = {
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:138.0) Gecko/20100101 Firefox/138.0',
		} as Navigator;

		const result = isSafari();
		expect( result ).toBe( false );
	} );

	it( 'returns false for Android Chrome user agent string', () => {
		globalThis.navigator = {
			userAgent:
				'Mozilla/5.0 (Linux; Android 10; SM-G960F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36',
		} as Navigator;

		const result = isSafari();
		expect( result ).toBe( false );
	} );

	it( 'returns false for Edge user agent string', () => {
		globalThis.navigator = {
			userAgent:
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0',
		} as Navigator;

		const result = isSafari();
		expect( result ).toBe( false );
	} );
} );

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
