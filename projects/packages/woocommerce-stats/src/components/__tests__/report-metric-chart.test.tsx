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

jest.mock( '@automattic/jetpack-premium-analytics-sdk', () => ( {
	buildMetricTab: jest.fn( () => ( {
		key: 'orders_value_net',
		label: 'Net sales',
		value: 100,
		current: [],
	} ) ),
	ChartEmptyState: () => <div />,
	MetricTabsChart: ( props: unknown ) => {
		mockMetricTabsChart( props );
		return <div />;
	},
	WidgetState: ( { children }: { children: ReactNode } ) => <>{ children }</>,
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
			chartTitle="Net sales over time"
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
			chartTitle="Net sales over time"
			dataFormat={ { type: 'currency' } }
			errorText="Could not load net sales."
		/>
	);

	expect( buildMetricTab ).toHaveBeenCalledWith( expect.objectContaining( { periodStarts } ) );
} );
