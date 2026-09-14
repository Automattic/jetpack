import { renderHook } from '@testing-library/react';
import { Orientation } from '@visx/axis';
import { useChartMargin } from '../use-chart-margin';
import type { XYChartTheme } from '@visx/xychart';

const mockGetLongestTickWidth = jest.fn();
jest.mock( '../../utils/get-longest-tick-width', () => ( {
	...jest.requireActual( '../../utils/get-longest-tick-width' ),
	getLongestTickWidth: ( ...args: unknown[] ) => mockGetLongestTickWidth( ...args ),
} ) );

// jsdom has no getComputedTextLength, so the real measurement always returns null.
const mockGetEdgeTickWidths = jest.fn();
jest.mock( '../../utils/get-edge-tick-widths', () => ( {
	...jest.requireActual( '../../utils/get-edge-tick-widths' ),
	getEdgeTickWidths: ( ...args: unknown[] ) => mockGetEdgeTickWidths( ...args ),
} ) );

describe( 'useChartMargin', () => {
	const baseTheme = {
		axisStyles: {
			y: {
				left: { axisLabel: { fontSize: 12 }, tickLabel: { fontSize: 11 }, tickLength: 8 },
				right: { axisLabel: { fontSize: 12 }, tickLabel: { fontSize: 11 }, tickLength: 8 },
			},
		},
	} as XYChartTheme;

	const data = [
		{
			label: 'Series 1',
			data: [ { date: new Date( '2024-01-01' ), value: 10 } ],
		},
		{
			label: 'Series 2',
			data: [ { date: new Date( '2024-01-02' ), value: 200 } ],
		},
	];
	const optionsBase = {
		yScale: {},
		axis: {
			y: {
				numTicks: 2,
				tickFormat: ( v: number ) => v.toString(),
			},
			x: {},
		},
	};

	beforeEach( () => {
		mockGetLongestTickWidth.mockReset();
		mockGetLongestTickWidth.mockReturnValue( 40 );
		mockGetEdgeTickWidths.mockReset();
		mockGetEdgeTickWidths.mockReturnValue( { first: 0, last: 0 } );
	} );

	it( 'calculates left margin for left y axis', () => {
		const options = {
			...optionsBase,
			axis: {
				...optionsBase.axis,
				y: {
					...optionsBase.axis.y,
					orientation: Orientation.left,
				},
			},
		};
		const height = 300;
		const theme = baseTheme;
		const { result } = renderHook( () => useChartMargin( height, options, data, theme ) );
		expect( mockGetLongestTickWidth ).toHaveBeenCalledWith(
			expect.any( Array ),
			options.axis.y.tickFormat,
			{ fontSize: '12px' }
		);
		// 40 label width + 8 tick length + ceil(11 * 0.25) label dx offset
		expect( result.current.left ).toBe( 51 );
	} );

	it( 'calculates right margin for right y axis', () => {
		const options = {
			...optionsBase,
			axis: {
				...optionsBase.axis,
				y: {
					...optionsBase.axis.y,
					orientation: Orientation.right,
				},
			},
		};
		const height = 300;
		const theme = baseTheme;
		const { result } = renderHook( () => useChartMargin( height, options, data, theme ) );
		expect( mockGetLongestTickWidth ).toHaveBeenCalledWith(
			expect.any( Array ),
			options.axis.y.tickFormat,
			{ fontSize: '12px' }
		);
		// 40 label width + 8 tick length + ceil(11 * 0.25) label dx offset
		expect( result.current.right ).toBe( 51 );
	} );

	it( 'uses explicit y tickValues when provided', () => {
		const options = {
			...optionsBase,
			axis: {
				...optionsBase.axis,
				y: {
					...optionsBase.axis.y,
					tickValues: [ 0, 1000 ],
				},
			},
		};
		const height = 300;
		const theme = baseTheme;
		renderHook( () => useChartMargin( height, options, data, theme ) );
		expect( mockGetLongestTickWidth ).toHaveBeenCalledWith(
			[ 0, 1000 ],
			options.axis.y.tickFormat,
			{ fontSize: '12px' }
		);
	} );

	it( 'sets top and bottom margin for top x axis', () => {
		const options = {
			...optionsBase,
			axis: {
				...optionsBase.axis,
				x: {
					orientation: Orientation.top,
				},
			},
		};
		const height = 300;
		const theme = baseTheme;
		const { result } = renderHook( () => useChartMargin( height, options, data, theme ) );
		// 12px font + 8 tick length = 20
		expect( result.current.top ).toBe( 20 );
		expect( result.current.bottom ).toBe( 10 );
	} );

	it( 'returns default margin if no axis options', () => {
		const options = { yScale: {}, axis: {} };
		const height = 300;
		const theme = baseTheme;
		const { result } = renderHook( () => useChartMargin( height, options, data, theme ) );
		// 40 label width + 8 tick length + ceil(11 * 0.25) label dx offset
		expect( result.current.left ).toBe( 51 );
		expect( result.current.top ).toBe( 10 );
		// 12px font + 8 tick length = 20
		expect( result.current.bottom ).toBe( 20 );
		expect( result.current.right ).toBe( 20 );
	} );

	it( 'increases bottom margin when X-axis tick labels are larger', () => {
		const options = optionsBase;
		const height = 300;
		const theme = {
			...baseTheme,
			axisStyles: {
				...baseTheme.axisStyles,
				x: {
					top: { axisLabel: { fontSize: 10 }, tickLength: 4 } as unknown as never,
					bottom: { axisLabel: { fontSize: 16 }, tickLength: 10 } as unknown as never,
				},
			},
		} as XYChartTheme;

		const { result } = renderHook( () => useChartMargin( height, options, data, theme ) );

		// 16px font + 10px tick length = 26, which is larger than the 20px default bottom margin.
		expect( result.current.bottom ).toBe( 26 );
	} );

	it( 'falls back to svgLabelSmall font size when X-axis axisLabel font size is missing', () => {
		const options = optionsBase;
		const height = 300;
		const theme = {
			...baseTheme,
			svgLabelSmall: { fontSize: 18 } as unknown as never,
			axisStyles: {
				...baseTheme.axisStyles,
				x: {
					top: { axisLabel: {}, tickLength: 5 } as unknown as never,
					bottom: { axisLabel: {}, tickLength: 7 } as unknown as never,
				},
			},
		} as XYChartTheme;

		const { result } = renderHook( () => useChartMargin( height, options, data, theme ) );

		// svgLabelSmall font size (18) + 7px tick length = 25.
		// This is larger than the 20px default bottom margin, so it should be used.
		expect( result.current.bottom ).toBe( 25 );
	} );

	describe( 'x-axis edge tick labels', () => {
		const tickFormat = ( value: number ) => new Date( value ).toDateString();
		const tickValues = [ 1, 2, 3 ];
		const datedXOptions = ( xOverrides = {} ) => ( {
			...optionsBase,
			axis: { ...optionsBase.axis, x: { tickValues, tickFormat, ...xOverrides } },
		} );

		it( 'reserves half of the last label on the right', () => {
			mockGetEdgeTickWidths.mockReturnValue( { first: 0, last: 60 } );

			const { result } = renderHook( () =>
				useChartMargin( 300, datedXOptions(), data, baseTheme )
			);

			expect( result.current.right ).toBe( 30 );
		} );

		it( 'keeps the default right margin when the last label fits inside it', () => {
			mockGetEdgeTickWidths.mockReturnValue( { first: 0, last: 30 } );

			const { result } = renderHook( () =>
				useChartMargin( 300, datedXOptions(), data, baseTheme )
			);

			expect( result.current.right ).toBe( 20 );
		} );

		it( 'widens the left margin past the y-axis reservation when the first label needs it', () => {
			mockGetEdgeTickWidths.mockReturnValue( { first: 120, last: 0 } );

			const { result } = renderHook( () =>
				useChartMargin( 300, datedXOptions(), data, baseTheme )
			);

			// 60 for the label's overhanging half, over the 51 the y-axis ticks need.
			expect( result.current.left ).toBe( 60 );
		} );

		it( 'measures the axis tick values with the x tick label style', () => {
			const theme = {
				...baseTheme,
				axisStyles: {
					...baseTheme.axisStyles,
					x: {
						bottom: { tickLabel: { fontSize: 11 }, tickLength: 8 } as unknown as never,
						top: {} as unknown as never,
					},
				},
			} as XYChartTheme;

			renderHook( () => useChartMargin( 300, datedXOptions(), data, theme ) );

			expect( mockGetEdgeTickWidths ).toHaveBeenCalledWith( tickValues, tickFormat, {
				fontSize: '11px',
			} );
		} );

		it( 'falls back to the raw tick label style when its font size is a relative unit', () => {
			const theme = {
				...baseTheme,
				axisStyles: {
					...baseTheme.axisStyles,
					x: {
						bottom: { tickLabel: { fontSize: '0.875rem' }, tickLength: 8 } as unknown as never,
						top: {} as unknown as never,
					},
				},
			} as XYChartTheme;

			renderHook( () => useChartMargin( 300, datedXOptions(), data, theme ) );

			expect( mockGetEdgeTickWidths ).toHaveBeenCalledWith( tickValues, tickFormat, {
				fontSize: '0.875rem',
			} );
		} );

		it( 'reserves the edge labels on a top x axis too', () => {
			mockGetEdgeTickWidths.mockReturnValue( { first: 120, last: 60 } );

			const { result } = renderHook( () =>
				useChartMargin( 300, datedXOptions( { orientation: 'top' } ), data, baseTheme )
			);

			expect( result.current.right ).toBe( 30 );
			expect( result.current.left ).toBe( 60 );
		} );

		it( 'reserves nothing for a hidden x axis', () => {
			mockGetEdgeTickWidths.mockReturnValue( { first: 120, last: 60 } );

			const { result } = renderHook( () =>
				useChartMargin( 300, datedXOptions( { display: false } ), data, baseTheme )
			);

			expect( mockGetEdgeTickWidths ).not.toHaveBeenCalled();
			expect( result.current.right ).toBe( 20 );
			expect( result.current.left ).toBe( 51 );
		} );
	} );

	describe( 'real measurement', () => {
		// Everything else here mocks the measurer out; this block runs it for real,
		// so that a width that never reaches the margin would fail something.
		const actual = jest.requireActual( '../../utils/get-edge-tick-widths' );
		type Measurable = { getComputedTextLength?: () => number };

		afterEach( () => {
			delete ( window.SVGElement.prototype as Measurable ).getComputedTextLength;
		} );

		it( 'turns a measured edge label into a reserved margin', () => {
			// jsdom ships no getComputedTextLength, so @visx/text cannot measure at all.
			( window.SVGElement.prototype as Measurable ).getComputedTextLength = function (
				this: SVGElement
			) {
				return ( this.textContent ?? '' ).length * 8;
			};
			mockGetEdgeTickWidths.mockImplementation( actual.getEdgeTickWidths );

			const options = {
				...optionsBase,
				axis: {
					...optionsBase.axis,
					x: {
						tickValues: [ 1, 2 ],
						tickFormat: ( _value: number, index: number ) =>
							index === 0 ? 'AA' : 'MEASURED-LAST',
					},
				},
			};

			const { result } = renderHook( () => useChartMargin( 300, options, data, baseTheme ) );

			// 'MEASURED-LAST' is 13 characters, so 104px wide, and half of it is reserved.
			expect( result.current.right ).toBe( 52 );
		} );
	} );

	describe( 'y axis gutter', () => {
		it( 'measures a caller-pinned domain rather than the data range', () => {
			const options = { ...optionsBase, yScale: { domain: [ 0, 1 ] as [ number, number ] } };

			renderHook( () => useChartMargin( 300, options, data, baseTheme ) );

			const ticks = mockGetLongestTickWidth.mock.calls[ 0 ][ 0 ] as number[];
			expect( Math.max( ...ticks ) ).toBeLessThanOrEqual( 1 );
		} );

		it( 'reserves no gutter for a hidden y axis', () => {
			const options = {
				...optionsBase,
				axis: { ...optionsBase.axis, y: { ...optionsBase.axis.y, display: false } },
			};

			const { result } = renderHook( () => useChartMargin( 300, options, data, baseTheme ) );

			expect( result.current.left ).toBe( 20 );
		} );
	} );

	describe( 'horizontal y ticks', () => {
		const horizontalOptions = ( tickFormat: ( value: string | number ) => string ) => ( {
			...optionsBase,
			axis: {
				...optionsBase.axis,
				y: { ...optionsBase.axis.y, orientation: Orientation.left, tickFormat },
			},
		} );

		it( 'measures dated ticks by formatting the raw timestamps once', () => {
			const formatHour = ( timestamp: string | number ) =>
				new Date( timestamp ).toLocaleTimeString( undefined, { hour: 'numeric', hour12: true } );
			const hourlyData = [
				{
					label: 'Series 1',
					data: [
						{ date: new Date( 2024, 0, 1, 6 ), value: 10 },
						{ date: new Date( 2024, 0, 1, 7 ), value: 20 },
					],
				},
			];

			renderHook( () =>
				useChartMargin( 300, horizontalOptions( formatHour ), hourlyData, baseTheme, true )
			);

			const [ ticks, measureFormatter ] = mockGetLongestTickWidth.mock.calls[ 0 ];
			// Raw timestamps, so the formatter runs exactly once — formatting here
			// and again while measuring would date-parse "6 AM" to "Invalid Date".
			expect( ticks ).toEqual( [
				new Date( 2024, 0, 1, 6 ).getTime(),
				new Date( 2024, 0, 1, 7 ).getTime(),
			] );
			expect( measureFormatter ).toBe( formatHour );
		} );

		it( "measures labelled ticks through the caller's formatter", () => {
			const withSuffix = ( label: string | number ) => `${ label } (total)`;
			const labelledData = [
				{
					label: 'Series 1',
					data: [
						{ label: 'Mon', value: 10 },
						{ label: 'Tuesday', value: 20 },
					],
				},
			];

			renderHook( () =>
				useChartMargin( 300, horizontalOptions( withSuffix ), labelledData, baseTheme, true )
			);

			const [ ticks, measureFormatter ] = mockGetLongestTickWidth.mock.calls[ 0 ];
			// A formatter that lengthens labels has to reach the measurement, or the
			// margin under-measures and the widest label clips at the SVG edge.
			expect( ticks ).toEqual( [ 'Mon', 'Tuesday' ] );
			expect( measureFormatter ).toBe( withSuffix );
		} );
	} );
} );
