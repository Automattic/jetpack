import { renderHook } from '@testing-library/react';
import { Orientation } from '@visx/axis';
import { useChartMargin } from '../use-chart-margin';
import type { XYChartTheme } from '@visx/xychart';

const mockGetLongestTickWidth = jest.fn();
jest.mock( '../utils', () => ( {
	...jest.requireActual( '../utils' ),
	getLongestTickWidth: ( ...args: unknown[] ) => mockGetLongestTickWidth( ...args ),
} ) );

describe( 'useChartMargin', () => {
	const baseTheme = {
		axisStyles: {
			y: {
				left: { axisLabel: { fontSize: 11 }, tickLength: 8 },
				right: { axisLabel: { fontSize: 11 }, tickLength: 8 },
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
		expect( result.current.left ).toBe( 48 ); // 40 + 8
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
		expect( result.current.right ).toBe( 48 ); // 40 + 8
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
		expect( result.current.top ).toBe( 20 );
		expect( result.current.bottom ).toBe( 10 );
	} );

	it( 'returns default margin if no axis options', () => {
		const options = { yScale: {}, axis: {} };
		const height = 300;
		const theme = baseTheme;
		const { result } = renderHook( () => useChartMargin( height, options, data, theme ) );
		expect( result.current.left ).toBe( 48 );
		expect( result.current.top ).toBe( 10 );
		expect( result.current.bottom ).toBe( 20 );
		expect( result.current.right ).toBe( 20 );
	} );
} );
