/**
 * External dependencies
 */
import { buildMetricTab } from '@automattic/jetpack-premium-analytics-sdk';
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { ReportMetricChart } from '../report-metric-chart';
import type { ComponentProps, ReactNode } from 'react';

const mockMetricTabsChart = jest.fn();
const mockWidgetState = jest.fn();

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	buildMetricTab: jest.fn( () => ( {
		key: 'orders_value_net',
		label: 'Net sales',
		value: 100,
		current: [],
	} ) ),
	ChartEmptyState: () => <div />,
	describeError: ( error: { code?: string } | undefined ) => ( {
		description: error?.code ?? 'generic',
	} ),
	MetricTabsChart: ( props: unknown ) => {
		mockMetricTabsChart( props );
		return <div />;
	},
	useOpenChartBucket: ( interval: string ) => ( { opensBucketsOf: interval } ),
	useWidgetRootContext: () => ( { reportParams: { interval: 'month' } } ),
	WidgetState: ( props: { children: ReactNode } ) => {
		mockWidgetState( props );
		return <>{ props.children }</>;
	},
} ) );

it( 'hides the redundant label in its single-metric chart', () => {
	const report = {
		primary: { data: { summary: {}, data: [ { date_start: '2026-10-01' } ] } },
		comparison: { data: undefined },
		hasComparison: false,
		timezone: 'UTC',
		isLoading: false,
		isFetching: false,
		hasData: true,
		isError: false,
		refetch: jest.fn(),
	} as unknown as ComponentProps< typeof ReportMetricChart >[ 'report' ];

	render(
		<ReportMetricChart
			report={ report }
			field="orders_value_net"
			label="Net sales"
			dataFormat={ { type: 'currency' } }
			errorText="Could not load net sales."
		/>
	);

	expect( mockMetricTabsChart ).toHaveBeenCalledWith(
		expect.objectContaining( { hideSingleMetricLabel: true } )
	);
} );

it( 'pairs the comparison with the current period by the dates each one starts', () => {
	const periodStarts = { current: '2026-10-01', comparison: '2026-09-01' };
	const report = {
		primary: { data: { summary: {}, data: [ { date_start: '2026-10-01' } ] } },
		comparison: { data: { summary: {}, data: [ { date_start: '2026-09-01' } ] } },
		hasComparison: true,
		periodStarts,
		timezone: 'UTC',
		isLoading: false,
		isFetching: false,
		hasData: true,
		isError: false,
		refetch: jest.fn(),
	} as unknown as ComponentProps< typeof ReportMetricChart >[ 'report' ];

	render(
		<ReportMetricChart
			report={ report }
			field="orders_value_net"
			label="Net sales"
			dataFormat={ { type: 'currency' } }
			errorText="Could not load net sales."
		/>
	);

	expect( buildMetricTab ).toHaveBeenCalledWith( expect.objectContaining( { periodStarts } ) );
} );

it( "shows the failed report's error as describeError words it, not a fixed retryable message", () => {
	const report = {
		primary: { data: undefined },
		comparison: { data: undefined },
		hasComparison: false,
		timezone: 'UTC',
		isLoading: false,
		isFetching: false,
		hasData: false,
		isError: true,
		error: { code: 'woocommerce_analytics_tables_not_ready', status: 503 },
		refetch: jest.fn(),
	} as unknown as ComponentProps< typeof ReportMetricChart >[ 'report' ];

	render(
		<ReportMetricChart
			report={ report }
			field="orders_value_net"
			label="Net sales"
			dataFormat={ { type: 'currency' } }
			errorText="Could not load net sales."
		/>
	);

	const calls = mockWidgetState.mock.calls;
	expect( calls[ calls.length - 1 ][ 0 ].error ).toEqual( {
		description: 'woocommerce_analytics_tables_not_ready',
	} );
} );

it( 'opens the clicked bucket at the interval the report was requested in', () => {
	const report = {
		primary: { data: { summary: {}, data: [ { date_start: '2026-10-01' } ] } },
		comparison: { data: undefined },
		hasComparison: false,
		timezone: 'UTC',
		isLoading: false,
		isFetching: false,
		hasData: true,
		isError: false,
		refetch: jest.fn(),
	} as unknown as ComponentProps< typeof ReportMetricChart >[ 'report' ];

	render(
		<ReportMetricChart
			report={ report }
			field="orders_no"
			label="Orders"
			chartTitle="Orders over time"
			dataFormat={ { type: 'number' } }
			errorText="Could not load orders."
		/>
	);

	expect( mockMetricTabsChart ).toHaveBeenLastCalledWith(
		expect.objectContaining( { onDatumClick: { opensBucketsOf: 'month' } } )
	);
} );
