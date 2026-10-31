import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { GlobalChartsProvider, defaultTheme } from '../../../providers';
import { AreaChartUnresponsive } from '../../area-chart/area-chart';
import { BarChartUnresponsive } from '../../bar-chart/bar-chart';
import { LineChartUnresponsive } from '../../line-chart/line-chart';
import type { ChartInstanceRef } from '../chart-instance-context';
import type { ComponentProps, ComponentType, ReactNode, Ref } from 'react';

const mockRefCallback = jest.fn();
jest.mock( '../../../hooks/use-element-size', () => ( {
	useElementSize: () => [ mockRefCallback, 500, 300 ],
} ) );

type CompactChartProps = {
	data: typeof data;
	width: number;
	height: number;
	compactWhenShort?: boolean;
	showLegend?: boolean;
	orientation?: 'horizontal' | 'vertical';
	margin?: { left?: number };
	withGradientFill?: boolean;
	chartId?: string;
	legend?: { interactive?: boolean };
	defaultHiddenSeries?: string[];
	children?: ReactNode;
	ref?: Ref< ChartInstanceRef >;
};
type ScaleRange = { range: () => number[] };
type CompactChart = ComponentType< CompactChartProps > & {
	Legend: ComponentType;
};

const data = [ 'A', 'B' ].map( ( label, offset ) => ( {
	label,
	data: [ 1, 2, 3 ].map( day => ( {
		date: new Date( 2024, 0, day ),
		value: day * 10 + offset,
	} ) ),
} ) );

const CHARTS = [
	[ 'LineChart', LineChartUnresponsive ],
	[ 'AreaChart', AreaChartUnresponsive ],
	[ 'BarChart', BarChartUnresponsive ],
] as unknown as [ string, CompactChart ][];

const chartTree = (
	Chart: CompactChart,
	props: Partial< CompactChartProps > = {},
	theme?: ComponentProps< typeof GlobalChartsProvider >[ 'theme' ]
) => (
	<GlobalChartsProvider theme={ theme }>
		<Chart
			data={ data }
			width={ 500 }
			height={ 300 }
			withGradientFill={ false }
			showLegend
			{ ...props }
		>
			<Chart.Legend />
		</Chart>
	</GlobalChartsProvider>
);

const renderChart = ( ...args: Parameters< typeof chartTree > ) => render( chartTree( ...args ) );

/* eslint-disable testing-library/no-node-access -- visx renders axes and grid lines without roles or test IDs. */
const chrome = () => ( {
	axes: document.querySelectorAll( '.visx-axis' ).length,
	grid: document.querySelectorAll( '.visx-rows, .visx-columns' ).length > 0,
	legends: screen.queryAllByTestId( 'legend-horizontal' ).length,
} );
/* eslint-enable testing-library/no-node-access */

const FULL = { axes: 2, grid: true, legends: 2 };
const COMPACT = { axes: 0, grid: false, legends: 0 };

describe( 'compactWhenShort', () => {
	describe.each( CHARTS )( '%s', ( _name, Chart ) => {
		it.each( [
			[ 'an unmeasured chart', 0, true, FULL ],
			[ 'a short chart', 100, true, COMPACT ],
			[ 'a tall chart', 300, true, FULL ],
			[ 'a short chart that did not opt in', 100, false, FULL ],
		] )( 'draws %s with the expected chrome', ( _label, height, compactWhenShort, expected ) => {
			renderChart( Chart, { height, compactWhenShort } );

			expect( chrome() ).toEqual( expected );
		} );

		it( 'restores the chrome when a short chart grows back', () => {
			const { rerender } = renderChart( Chart, { height: 100, compactWhenShort: true } );
			rerender( chartTree( Chart, { height: 300, compactWhenShort: true } ) );

			expect( chrome() ).toEqual( FULL );
		} );

		it( 'does not point at the hidden legend when every series is hidden', () => {
			renderChart( Chart, {
				height: 100,
				compactWhenShort: true,
				chartId: 'all-hidden',
				legend: { interactive: true },
				defaultHiddenSeries: [ 'A', 'B' ],
			} );

			expect( screen.getByText( 'All series are hidden.' ) ).toBeInTheDocument();
		} );
	} );

	it( 'reads the threshold from the theme', () => {
		renderChart(
			LineChartUnresponsive as unknown as CompactChart,
			{ height: 160, compactWhenShort: true },
			{ sparkline: { compactBelow: 200 } }
		);

		expect( chrome() ).toEqual( COMPACT );
	} );

	it( 'leaves horizontal bars alone', () => {
		renderChart( BarChartUnresponsive as unknown as CompactChart, {
			height: 100,
			compactWhenShort: true,
			orientation: 'horizontal',
		} );

		expect( chrome() ).toEqual( FULL );
	} );

	describe.each( CHARTS.slice( 0, 2 ) )( '%s margin', ( _name, Chart ) => {
		it.each( [
			[ 'defaults to the sparkline margin', undefined, 2 ],
			[ 'keeps a side the caller set', { left: 40 }, 40 ],
		] )( '%s', ( _label, margin, left ) => {
			const ref = createRef< ChartInstanceRef >();
			renderChart( Chart, { height: 100, compactWhenShort: true, margin, ref } );

			const scales = ref.current?.getScales() as Record< 'xScale' | 'yScale', ScaleRange >;
			expect( scales.xScale.range()[ 0 ] ).toBe( left );
			expect( scales.yScale.range()[ 1 ] ).toBe( 2 );
		} );
	} );

	describe( 'BarChart margin', () => {
		const leftmostBarX = ( margin?: { left?: number } ) => {
			const { unmount } = renderChart( BarChartUnresponsive as unknown as CompactChart, {
				height: 100,
				compactWhenShort: true,
				margin,
			} );
			// eslint-disable-next-line testing-library/no-node-access -- visx bars take no role or test ID.
			const bars = [ ...document.querySelectorAll( '.visx-bar' ) ];
			const x = Math.min( ...bars.map( bar => Number( bar.getAttribute( 'x' ) ) ) );
			unmount();
			return x;
		};

		it( 'defaults to the sparkline margin', () => {
			expect( leftmostBarX() ).toBe( leftmostBarX( defaultTheme.sparkline.margin ) );
		} );

		it( 'keeps a side the caller set', () => {
			expect( leftmostBarX( { left: 40 } ) ).toBeGreaterThan( leftmostBarX() );
		} );
	} );
} );
