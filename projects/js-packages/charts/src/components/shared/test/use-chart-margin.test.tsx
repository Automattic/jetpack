import { renderHook } from '@testing-library/react';
import { Orientation } from '@visx/axis';
import { XYChartTheme } from '@visx/xychart';
import { useChartMargin } from '../use-chart-margin';

const mockGetLongestLabelWidth = jest.fn();
jest.mock( '../utils', () => ( {
	...jest.requireActual( '../utils' ),
	getLongestLabelWidth: ( ...args: unknown[] ) => mockGetLongestLabelWidth( ...args ),
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
		{ date: new Date( '2024-01-01' ), value: 10 },
		{ date: new Date( '2024-01-02' ), value: 200 },
	];
	const formatter = ( v: number ) => v.toString();

	beforeEach( () => {
		mockGetLongestLabelWidth.mockReset();
		mockGetLongestLabelWidth.mockReturnValue( 40 );
	} );

	it( 'calculates left margin for left y axis', () => {
		const options = { axis: { y: { orientation: Orientation.left } } };
		const theme = baseTheme;
		const { result } = renderHook( () => useChartMargin( options, data, formatter, theme ) );
		expect( mockGetLongestLabelWidth ).toHaveBeenCalledWith(
			data,
			formatter,
			theme.axisStyles.y.left.axisLabel
		);
		expect( result.current.left ).toBe( 48 ); // 40 + 8
	} );

	it( 'calculates right margin for right y axis', () => {
		const options = { axis: { y: { orientation: Orientation.right } } };
		const theme = baseTheme;
		const { result } = renderHook( () => useChartMargin( options, data, formatter, theme ) );
		expect( mockGetLongestLabelWidth ).toHaveBeenCalledWith(
			data,
			formatter,
			theme.axisStyles.y.right.axisLabel
		);
		expect( result.current.right ).toBe( 48 ); // 40 + 8
	} );

	it( 'sets top and bottom margin for top x axis', () => {
		const options = { axis: { x: { orientation: Orientation.top } } };
		const theme = baseTheme;
		const { result } = renderHook( () => useChartMargin( options, data, formatter, theme ) );
		expect( result.current.top ).toBe( 20 );
		expect( result.current.bottom ).toBe( 10 );
	} );

	it( 'returns default margin if no axis options', () => {
		const options = {};
		const theme = baseTheme;
		const { result } = renderHook( () => useChartMargin( options, data, formatter, theme ) );
		expect( result.current.left ).toBe( 48 );
		expect( result.current.top ).toBe( 10 );
		expect( result.current.bottom ).toBe( 20 );
		expect( result.current.right ).toBe( 0 );
	} );
} );
