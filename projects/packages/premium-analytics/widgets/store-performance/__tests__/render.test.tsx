/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
/**
 * Internal dependencies
 */
import StorePerformanceRender from '../render';

const mockEmptyReport = {
	primary: { data: { summary: {}, data: [] } },
	comparison: { data: { summary: {}, data: [] } },
	timezone: 'UTC',
	isLoading: false,
	isFetching: false,
	isError: false,
	hasData: false,
	refetch: jest.fn(),
};

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useReportOrders: () => mockEmptyReport,
	useReportVisitors: () => mockEmptyReport,
	useReportConversionRate: () => mockEmptyReport,
	useReportCustomersByDate: () => mockEmptyReport,
} ) );

// The chart itself is visx SVG rendering, outside this widget's concern.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	MetricTabsChart: ( { empty }: { empty?: ReactNode } ) => (
		<div data-testid="metric-tabs-chart">{ empty }</div>
	),
} ) );

// WidgetRoot reads URL search params as a fallback for report params; outside
// a matched route the real hook warns and throws.
jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

describe( 'StorePerformanceRender', () => {
	it( 'shows the no-results message in the chart for a store without orders or visits', () => {
		render( <StorePerformanceRender attributes={ {} } /> );

		expect(
			screen.getByText( 'We couldn’t find results for this time period.' )
		).toBeInTheDocument();
	} );
} );
