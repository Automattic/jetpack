/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import StorePerformanceRender from '../render';
import type { StorePerformanceMetric } from '../../../src/store-performance/metric';
import type { ReactNode } from 'react';

const mockMetricTabsChart = jest.fn();
const mockWidgetState = jest.fn();

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	buildMetricTab: jest.fn( () => ( { key: 'orders', label: 'Orders', value: 1, current: [] } ) ),
	ChartEmptyState: () => <div />,
	// Like the real one, offers Retry for every failure but an outdated schema.
	describeError: ( error: { code?: string } | undefined ) =>
		error?.code === 'woocommerce_analytics_schema_outdated'
			? { description: error.code }
			: { description: error?.code ?? 'generic', actions: [ { label: 'Retry' } ] },
	MetricTabsChart: ( props: unknown ) => {
		mockMetricTabsChart( props );
		return <div />;
	},
	MetricTabsChartSkeleton: () => <div />,
	useOpenChartBucket: ( interval: string ) => ( { opensBucketsOf: interval } ),
	useWidgetRootContext: () => ( { reportParams: { interval: 'week' } } ),
	WidgetRoot: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	WidgetState: ( props: { children: ReactNode } ) => {
		mockWidgetState( props );
		return <>{ props.children }</>;
	},
} ) );

const REPORT = {
	primary: { data: { summary: {}, data: [] } },
	comparison: { data: undefined },
	hasComparison: false,
	timezone: 'UTC',
	isLoading: false,
	isFetching: false,
	isError: false,
	hasData: true,
	refetch: jest.fn(),
};

let mockReport: Record< string, unknown > = REPORT;

const METRIC = {
	id: 'orders',
	label: 'Orders',
	description: 'Orders placed.',
	field: 'orders_no',
	dataFormat: { type: 'number' },
	useReport: () => mockReport,
} as unknown as StorePerformanceMetric;

let mockVisitorsReport: Record< string, unknown > = REPORT;

const VISITORS_METRIC = {
	...METRIC,
	id: 'visitors',
	label: 'Visitors',
	field: 'visitors',
	useReport: () => mockVisitorsReport,
} as unknown as StorePerformanceMetric;

let mockMetrics = [ METRIC ];

afterEach( () => {
	mockReport = REPORT;
	mockVisitorsReport = REPORT;
	mockMetrics = [ METRIC ];
} );

jest.mock( '../use-store-performance-metrics', () => ( {
	useStorePerformanceMetrics: () => mockMetrics,
} ) );

it.each( [ 'line', 'bar' ] as const )( 'draws the %s chart the widget saved', chartType => {
	render( <StorePerformanceRender attributes={ { chartType } } /> );

	const calls = mockMetricTabsChart.mock.calls;
	expect( calls[ calls.length - 1 ][ 0 ] ).toEqual( expect.objectContaining( { chartType } ) );
} );

it( 'opens the clicked bucket at the interval the reports were requested in', () => {
	render( <StorePerformanceRender attributes={ {} } /> );

	const calls = mockMetricTabsChart.mock.calls;
	expect( calls[ calls.length - 1 ][ 0 ].onDatumClick ).toEqual( { opensBucketsOf: 'week' } );
} );

it( 'shows the failed report error as describeError words it, not a fixed retryable message', () => {
	mockReport = {
		...REPORT,
		isError: true,
		hasData: false,
		error: { code: 'woocommerce_analytics_schema_outdated', status: 400 },
	};

	render( <StorePerformanceRender attributes={ {} } /> );

	const calls = mockWidgetState.mock.calls;
	expect( calls[ calls.length - 1 ][ 0 ] ).toEqual(
		expect.objectContaining( {
			isError: true,
			error: { description: 'woocommerce_analytics_schema_outdated' },
		} )
	);
} );

it( 'keeps Retry when an outdated schema fails beside a report that can recover', () => {
	mockMetrics = [ METRIC, VISITORS_METRIC ];
	mockReport = {
		...REPORT,
		isError: true,
		hasData: false,
		error: { code: 'woocommerce_analytics_schema_outdated', status: 400 },
	};
	mockVisitorsReport = { ...REPORT, isError: true, hasData: false, error: { status: 500 } };

	render( <StorePerformanceRender attributes={ {} } /> );

	const calls = mockWidgetState.mock.calls;
	expect( calls[ calls.length - 1 ][ 0 ].error ).toEqual( {
		description: 'generic',
		actions: [ { label: 'Retry' } ],
	} );
} );
