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
	describeError: ( error: { code?: string } | undefined ) => ( {
		description: error?.code ?? 'generic',
	} ),
	MetricTabsChart: ( props: unknown ) => {
		mockMetricTabsChart( props );
		return <div />;
	},
	MetricTabsChartSkeleton: () => <div />,
	useWidgetRootContext: () => ( { reportParams: {} } ),
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

afterEach( () => {
	mockReport = REPORT;
} );

jest.mock( '../use-store-performance-metrics', () => ( {
	useStorePerformanceMetrics: () => [ METRIC ],
} ) );

it.each( [ 'line', 'bar' ] as const )( 'draws the %s chart the widget saved', chartType => {
	render( <StorePerformanceRender attributes={ { chartType } } /> );

	const calls = mockMetricTabsChart.mock.calls;
	expect( calls[ calls.length - 1 ][ 0 ] ).toEqual( expect.objectContaining( { chartType } ) );
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
