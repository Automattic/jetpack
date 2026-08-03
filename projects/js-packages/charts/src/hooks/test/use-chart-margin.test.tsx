import { renderHook } from '@testing-library/react';
import { Orientation } from '@visx/axis';
import { useChartMargin } from '../use-chart-margin';
import type { XYChartTheme } from '@visx/xychart';

const mockGetLongestTickWidth = jest.fn();
jest.mock( '../../utils/get-longest-tick-width', () => ( {
	...jest.requireActual( '../../utils/get-longest-tick-width' ),
	getLongestTickWidth: ( ...args: unknown[] ) => mockGetLongestTickWidth( ...args ),
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
			theme.axisStyles.y.left.axisLabel
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
			theme.axisStyles.y.right.axisLabel
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
			theme.axisStyles.y.left.axisLabel
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

	it( 'measures pre-formatted horizontal tick labels without re-formatting them', () => {
		const formatHour = ( timestamp: number ) =>
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
		const options = {
			...optionsBase,
			axis: {
				...optionsBase.axis,
				y: { ...optionsBase.axis.y, orientation: Orientation.left, tickFormat: formatHour },
			},
		};

		renderHook( () => useChartMargin( 300, options, hourlyData, baseTheme, true ) );

		const [ ticks, measureFormatter ] = mockGetLongestTickWidth.mock.calls[ 0 ];
		// yTicks are already formatted hour strings; re-applying the hour
		// formatter would date-parse them into "Invalid Date".
		expect( ticks ).toEqual( [
			formatHour( new Date( 2024, 0, 1, 6 ).getTime() ),
			formatHour( new Date( 2024, 0, 1, 7 ).getTime() ),
		] );
		expect( measureFormatter( ticks[ 0 ], 0, [] ) ).toBe( ticks[ 0 ] );
	} );
} );
