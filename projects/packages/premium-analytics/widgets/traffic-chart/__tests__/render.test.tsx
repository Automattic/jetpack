/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { ReportScopeProvider } from '@jetpack-premium-analytics/data';
import { render, screen } from '@testing-library/react';
import { getSettings, setSettings } from '@wordpress/date';
/**
 * Internal dependencies
 */
import TrafficChartRender from '../render';
import useTrafficChart from '../use-traffic-chart';
import type { ReportParams } from '@jetpack-premium-analytics/data';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '../use-traffic-chart' );

jest.mock( '@automattic/jetpack-script-data', () => ( { getScriptData: jest.fn() } ) );

setSettings( {
	...getSettings(),
	timezone: { string: 'UTC', offset: 0, offsetFormatted: '0', abbr: 'UTC' },
} );

// The chart itself is not this file's subject: `useTrafficChart` resolves the
// bucket. The stand-in records props so the click handler can be driven.
const mockMetricTabsChart = jest.fn();
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	MetricTabsChart: ( props: unknown ) => {
		mockMetricTabsChart( props );
		return null;
	},
} ) );

const mockUseTrafficChart = jest.mocked( useTrafficChart );
const mockGetScriptData = jest.mocked( getScriptData );

const V1_KEY = 'jetpack_stats_chart_type_123';

// `normalizeReportParams` coerces away an interval the range disallows, so each
// one needs a range long enough to survive reaching the widget.
const RANGE_FOR_INTERVAL: Record< string, { from: string; to: string } > = {
	hour: { from: '2026-06-29', to: '2026-06-30' },
	day: { from: '2026-06-01', to: '2026-06-30' },
	week: { from: '2026-01-01', to: '2026-06-30' },
	month: { from: '2025-01-01', to: '2026-06-30' },
	year: { from: '2023-01-01', to: '2026-06-30' },
};

function reportParams( interval: string ): ReportParams {
	return { ...RANGE_FOR_INTERVAL[ interval ], interval } as ReportParams;
}

/** The bucket the widget asked its data hook for on the latest render. */
function requestedBucket(): string {
	const calls = mockUseTrafficChart.mock.calls;
	return calls[ calls.length - 1 ][ 1 ];
}

/** The click handler the widget handed the chart on the latest render. */
function chartClickHandler(): ( date: Date ) => void {
	const calls = mockMetricTabsChart.mock.calls;
	return calls[ calls.length - 1 ][ 0 ].onDatumClick;
}

/** The `chartType` the widget handed the chart on the latest render. */
function drawnChartType(): string {
	const calls = mockMetricTabsChart.mock.calls;
	return calls[ calls.length - 1 ][ 0 ].chartType;
}

beforeEach( () => {
	window.localStorage.clear();
	mockGetScriptData.mockReturnValue( { site: { wpcom: { blog_id: 123 } } } as never );
	mockMetricTabsChart.mockClear();
	mockUseTrafficChart.mockReset();
	mockUseTrafficChart.mockReturnValue( {
		metrics: [
			{
				key: 'views',
				label: 'Views',
				value: 10,
				current: [ { date: new Date( '2026-05-01' ), value: 10 } ],
			},
		],
		isLoading: false,
		isFetching: false,
		isError: false,
		refetch: jest.fn(),
	} );
} );

describe( 'TrafficChart chart type', () => {
	it( 'draws bars by default', () => {
		render( <TrafficChartRender attributes={ { reportParams: reportParams( 'day' ) } } /> );

		expect( drawnChartType() ).toBe( 'bar' );
	} );

	it( 'keeps a saved choice', () => {
		render(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'day' ), chartType: 'line' } }
			/>
		);

		expect( drawnChartType() ).toBe( 'line' );
	} );
} );

describe( 'TrafficChart inherited Stats v1 choice', () => {
	const attributes = { reportParams: reportParams( 'day' ) };

	it( 'draws the chart type Stats v1 saved, without writing it to the layout', () => {
		window.localStorage.setItem( V1_KEY, 'line' );
		const setAttributes = jest.fn();

		render( <TrafficChartRender attributes={ attributes } setAttributes={ setAttributes } /> );

		expect( drawnChartType() ).toBe( 'line' );
		expect( setAttributes ).not.toHaveBeenCalled();
	} );

	it( 'lets a chart type set on the widget win', () => {
		window.localStorage.setItem( V1_KEY, 'line' );

		render( <TrafficChartRender attributes={ { ...attributes, chartType: 'bar' } } /> );

		expect( drawnChartType() ).toBe( 'bar' );
	} );

	it( 'ignores a saved value that is not a chart type', () => {
		window.localStorage.setItem( V1_KEY, 'pie' );

		render( <TrafficChartRender attributes={ attributes } /> );

		expect( drawnChartType() ).toBe( 'bar' );
	} );

	it( 'ignores a choice saved for a different site', () => {
		window.localStorage.setItem( 'jetpack_stats_chart_type_999', 'line' );

		render( <TrafficChartRender attributes={ attributes } /> );

		expect( drawnChartType() ).toBe( 'bar' );
	} );

	it( 'falls back to the default when the site id is unknown', () => {
		mockGetScriptData.mockReturnValue( undefined as never );
		window.localStorage.setItem( V1_KEY, 'line' );

		render( <TrafficChartRender attributes={ attributes } /> );

		expect( drawnChartType() ).toBe( 'bar' );
	} );

	it( 'falls back to the default when browser storage cannot be read', () => {
		jest.spyOn( Storage.prototype, 'getItem' ).mockImplementation( () => {
			throw new Error( 'blocked' );
		} );

		render( <TrafficChartRender attributes={ attributes } /> );

		expect( drawnChartType() ).toBe( 'bar' );
		jest.restoreAllMocks();
	} );
} );

describe( 'TrafficChart bucket size', () => {
	it.each( [ 'hour', 'day', 'week', 'month' ] )( 'follows the page interval: %s', interval => {
		render( <TrafficChartRender attributes={ { reportParams: reportParams( interval ) } } /> );

		expect( requestedBucket() ).toBe( interval );
	} );

	// `year` is the only interval the dashboard still offers that this chart has
	// no bucket for, so it is what reaches the clamp to the coarsest offered.
	it( 'resolves a page interval this chart cannot draw to one it can', () => {
		render( <TrafficChartRender attributes={ { reportParams: reportParams( 'year' ) } } /> );

		expect( requestedBucket() ).toBe( 'month' );
	} );

	// The Group by attribute this widget used to declare (WOOA7S-1987): a saved
	// layout can still carry it, and it must not override the page.
	it( 'ignores a granularity persisted before the widget dropped the control', () => {
		const staleAttributes = {
			reportParams: reportParams( 'month' ),
			granularity: 'day',
			granularityPickedFor: 'month',
		};

		render( <TrafficChartRender attributes={ staleAttributes } /> );

		expect( requestedBucket() ).toBe( 'month' );
	} );

	// The widget resolves this from `reportParams` alone, so it cannot need a
	// host setter — and cannot dirty the saved layout just by rendering.
	it( 'writes nothing, whatever it is handed', () => {
		const setAttributes = jest.fn();

		render(
			<TrafficChartRender
				attributes={ { reportParams: reportParams( 'month' ) } }
				setAttributes={ setAttributes }
			/>
		);

		expect( setAttributes ).not.toHaveBeenCalled();
	} );
} );

describe( 'TrafficChart drill-down', () => {
	// A yearly page draws in months here, so the click must open the month:
	// left to the page interval, a click on February would open the whole year.
	it( 'sets the period to the bar it drew, not the page interval', () => {
		const openPeriod = jest.fn();
		render(
			<ReportScopeProvider openPeriod={ openPeriod }>
				<TrafficChartRender attributes={ { reportParams: reportParams( 'year' ) } } />
			</ReportScopeProvider>
		);

		chartClickHandler()( new Date( '2026-02-14T00:00:00.000Z' ) );

		expect( openPeriod ).toHaveBeenCalledWith( {
			from: new Date( '2026-02-01T00:00:00.000Z' ),
			to: new Date( '2026-02-28T23:59:59.999Z' ),
		} );
	} );

	it( 'cuts an edge bar to the window it drew', () => {
		const openPeriod = jest.fn();
		render(
			<ReportScopeProvider openPeriod={ openPeriod }>
				<TrafficChartRender
					attributes={ {
						reportParams: {
							from: '2026-02-10',
							to: '2026-06-30',
							interval: 'month',
						} as ReportParams,
					} }
				/>
			</ReportScopeProvider>
		);

		chartClickHandler()( new Date( '2026-02-14T00:00:00.000Z' ) );

		expect( openPeriod ).toHaveBeenCalledWith( {
			from: new Date( '2026-02-10T00:00:00.000Z' ),
			to: new Date( '2026-02-28T23:59:59.999Z' ),
		} );
	} );

	it( 'leaves the bars inert on a surface with no period to set', () => {
		render( <TrafficChartRender attributes={ { reportParams: reportParams( 'year' ) } } /> );

		expect( chartClickHandler() ).toBeUndefined();
	} );
} );

describe( 'TrafficChart with an idle window', () => {
	const zeroFilled = ( key: string, label: string ) => ( {
		key,
		label,
		value: 0,
		current: [
			{ date: new Date( '2026-05-01' ), value: 0 },
			{ date: new Date( '2026-05-02' ), value: 0 },
		],
	} );

	it( 'passes the no-results message to the chart', () => {
		mockUseTrafficChart.mockReturnValue( {
			metrics: [ zeroFilled( 'views', 'Views' ), zeroFilled( 'visitors', 'Visitors' ) ],
			isLoading: false,
			isFetching: false,
			isError: false,
			refetch: jest.fn(),
		} );

		render( <TrafficChartRender attributes={ { reportParams: reportParams( 'day' ) } } /> );

		const calls = mockMetricTabsChart.mock.calls;
		const { empty } = calls[ calls.length - 1 ][ 0 ];
		render( empty );

		expect(
			screen.getByText( 'We couldn’t find results for this time period.' )
		).toBeInTheDocument();
	} );
} );
