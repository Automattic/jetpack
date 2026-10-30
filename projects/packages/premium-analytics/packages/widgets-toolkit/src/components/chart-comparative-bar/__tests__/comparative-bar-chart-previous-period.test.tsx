/**
 * External dependencies
 */
import { GlobalChartsProvider } from '@jetpack-premium-analytics/externals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import { ComparativeBarChart } from '../comparative-bar-chart';
import type { DatedTooltipProps } from '../../chart-tooltip';
import type { ComparativeBarChartSeries } from '../types';
import type { ComponentProps } from 'react';

type RecordedBarChart = {
	data: ComparativeBarChartSeries[];
	colors: string[];
	defaultHiddenSeries?: string[];
	renderTooltip: ( params: unknown ) => { props: DatedTooltipProps } | null;
};

const mockBarCharts: RecordedBarChart[] = [];

// jsdom draws the chart at zero width, so the bars are read from what the real chart is handed and the colors it derives from that.
jest.mock( '@jetpack-premium-analytics/externals', () => {
	const actual = jest.requireActual( '@jetpack-premium-analytics/externals' );
	const { createElement } = jest.requireActual( 'react' );
	const BarChart = ( props: Record< string, unknown > ) => {
		const colors = actual.useBarColors()( props.data, { layout: props.layout } );
		mockBarCharts.push( { ...props, colors } as unknown as RecordedBarChart );
		return createElement( actual.BarChart, props );
	};
	BarChart.Legend = actual.BarChart.Legend;
	return { ...actual, BarChart };
} );

const CHART_ID = 'traffic';
const DATA_FORMAT = { type: 'number' as const };
const JULY_1 = new Date( '2026-07-01T00:00:00Z' );
const JULY_2 = new Date( '2026-07-02T00:00:00Z' );

const series = (
	label: string,
	group: string,
	values: [ number, number ],
	comparison = false
): ComparativeBarChartSeries => ( {
	label,
	group,
	...( comparison && { options: { type: 'comparison' as const } } ),
	data: [
		{ date: JULY_1, value: values[ 0 ] },
		{ date: JULY_2, value: values[ 1 ] },
	],
} );

const SERIES = [
	series( 'Views', 'views', [ 100, 200 ] ),
	series( 'Previous views', 'views', [ 80, 120 ], true ),
	series( 'Visitors', 'visitors', [ 40, 60 ] ),
	series( 'Previous visitors', 'visitors', [ 30, 35 ], true ),
];

const CURRENT_SERIES = SERIES.filter( item => item.options?.type !== 'comparison' );

const chart = ( props: Partial< ComponentProps< typeof ComparativeBarChart > > = {} ) => (
	<GlobalChartsProvider>
		<ComparativeBarChart
			chartId={ CHART_ID }
			series={ SERIES }
			dataFormat={ DATA_FORMAT }
			layout="overlap"
			comparisonLabel="Prev. 7 days"
			{ ...props }
		/>
	</GlobalChartsProvider>
);

const renderChart = ( props: Partial< ComponentProps< typeof ComparativeBarChart > > = {} ) =>
	render( chart( props ) );

const lastBarChart = () => {
	expect( mockBarCharts.length ).toBeGreaterThan( 0 );
	return mockBarCharts[ mockBarCharts.length - 1 ];
};
const drawnLabels = () => lastBarChart().data.map( item => item.label );
const colorOf = ( label: string ) => {
	const { data, colors } = lastBarChart();
	return colors[ data.findIndex( item => item.label === label ) ];
};

// jsdom measures the chart at zero width, which hides it from role queries.
const legendButton = ( name: RegExp ) => {
	const item = screen.getByLabelText( name );
	expect( item ).toHaveAttribute( 'role', 'button' );
	return item;
};
const previousPeriodItem = () => legendButton( /^Prev\. 7 days/ );
const visitorsItem = () => legendButton( /^Visitors/ );

describe( 'ComparativeBarChart previous-period toggle', () => {
	beforeEach( () => {
		mockBarCharts.length = 0;
		jest.useFakeTimers();
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	const setupUser = () => userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );

	it.each( [ false, true ] )(
		'draws the previous period only when previousPeriodShown is true (%s)',
		shown => {
			renderChart( { previousPeriodShown: shown, onPreviousPeriodShownChange: jest.fn() } );

			expect( previousPeriodItem() ).toHaveAttribute( 'aria-pressed', String( shown ) );
			expect( drawnLabels() ).toEqual(
				shown
					? [ 'Views', 'Previous views', 'Visitors', 'Previous visitors' ]
					: [ 'Views', 'Visitors' ]
			);
		}
	);

	it.each( [ false, true ] )(
		'reports the opposite value when the item is pressed (%s)',
		async shown => {
			const user = setupUser();
			const onPreviousPeriodShownChange = jest.fn();
			renderChart( { previousPeriodShown: shown, onPreviousPeriodShownChange } );

			await user.click( previousPeriodItem() );

			expect( onPreviousPeriodShownChange ).toHaveBeenCalledTimes( 1 );
			expect( onPreviousPeriodShownChange ).toHaveBeenCalledWith( ! shown );
		}
	);

	it( "hides a hidden metric's previous bar while the previous period is on", async () => {
		const user = setupUser();
		renderChart( { previousPeriodShown: true, onPreviousPeriodShownChange: jest.fn() } );

		await user.click( visitorsItem() );

		expect( drawnLabels() ).toEqual( [ 'Views', 'Previous views', 'Visitors' ] );
	} );

	it( "draws a revealed metric's previous period when the metric started hidden", async () => {
		const user = setupUser();
		renderChart( {
			previousPeriodShown: true,
			onPreviousPeriodShownChange: jest.fn(),
			defaultHiddenSeries: [ 'Visitors', 'Previous visitors' ],
		} );
		expect( drawnLabels() ).not.toContain( 'Previous visitors' );

		await user.click( visitorsItem() );

		expect( drawnLabels() ).toContain( 'Previous visitors' );
		expect( lastBarChart().defaultHiddenSeries ).toEqual( [ 'Visitors' ] );
	} );

	it.each( [ false, true ] )(
		'keeps the item static without onPreviousPeriodShownChange (%s)',
		shown => {
			renderChart( { previousPeriodShown: shown } );

			expect( screen.queryByLabelText( /^Prev\. 7 days/ ) ).not.toBeInTheDocument();
			expect( screen.queryAllByText( 'Prev. 7 days' ) ).toHaveLength( shown ? 1 : 0 );
			expect( drawnLabels().includes( 'Previous views' ) ).toBe( shown );
		}
	);

	it( 'keeps previous-period values in the tooltip while the bars are off', () => {
		renderChart( { previousPeriodShown: false } );

		const entry = ( key: string, value: number ) => ( { datum: { date: JULY_1, value }, key } );
		/* eslint-disable testing-library/render-result-naming-convention --
		   `renderTooltip` is the chart's prop, not testing-library's `render()`. */
		const tooltip = lastBarChart().renderTooltip( {
			tooltipData: {
				nearestDatum: entry( 'Views', 100 ),
				datumByKey: {
					Views: { ...entry( 'Views', 100 ), index: 0 },
					Visitors: { ...entry( 'Visitors', 40 ), index: 1 },
				},
			},
		} );
		/* eslint-enable testing-library/render-result-naming-convention */

		expect(
			tooltip?.props.model.rows.map( row => [ row.name, row.value, row.previous?.value ] )
		).toEqual( [
			[ 'Views', 100, 80 ],
			[ 'Visitors', 40, 30 ],
		] );
	} );

	it( 'keeps the current-period bar colors when the previous period is toggled', () => {
		const view = renderChart( { previousPeriodShown: false } );
		const hiddenColors = [ colorOf( 'Views' ), colorOf( 'Visitors' ) ];

		view.rerender( chart( { previousPeriodShown: true } ) );

		expect( [ colorOf( 'Views' ), colorOf( 'Visitors' ) ] ).toEqual( hiddenColors );
	} );

	it( 'has no previous-period item without comparison series', () => {
		renderChart( { previousPeriodShown: false, series: CURRENT_SERIES } );

		expect( screen.queryByText( 'Prev. 7 days' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps the static item and draws the previous period without the prop', () => {
		renderChart( { legendInteractive: true } );

		expect( screen.getByText( 'Prev. 7 days' ) ).toBeInTheDocument();
		expect( screen.queryByLabelText( /^Prev\. 7 days/ ) ).not.toBeInTheDocument();
		expect( drawnLabels() ).toEqual( [
			'Views',
			'Previous views',
			'Visitors',
			'Previous visitors',
		] );
	} );
} );
