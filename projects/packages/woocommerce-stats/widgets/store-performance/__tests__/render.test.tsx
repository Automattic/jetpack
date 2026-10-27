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

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	buildMetricTab: jest.fn( () => ( { key: 'orders', label: 'Orders', value: 1, current: [] } ) ),
	ChartEmptyState: () => <div />,
	MetricTabsChart: ( props: unknown ) => {
		mockMetricTabsChart( props );
		return <div />;
	},
	MetricTabsChartSkeleton: () => <div />,
	useWidgetRootContext: () => ( { reportParams: {} } ),
	WidgetRoot: ( { children }: { children: ReactNode } ) => <>{ children }</>,
	WidgetState: ( { children }: { children: ReactNode } ) => <>{ children }</>,
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

const METRIC = {
	id: 'orders',
	label: 'Orders',
	description: 'Orders placed.',
	field: 'orders_no',
	dataFormat: { type: 'number' },
	useReport: () => REPORT,
} as unknown as StorePerformanceMetric;

jest.mock( '../use-store-performance-metrics', () => ( {
	useStorePerformanceMetrics: () => [ METRIC ],
} ) );

it.each( [ 'line', 'bar' ] as const )( 'draws the %s chart the widget saved', chartType => {
	render( <StorePerformanceRender attributes={ { chartType } } /> );

	const calls = mockMetricTabsChart.mock.calls;
	expect( calls[ calls.length - 1 ][ 0 ] ).toEqual( expect.objectContaining( { chartType } ) );
} );
