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

// The chart itself is visx SVG rendering, outside this widget's concern. Keep
// each tab's count label observable.
jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	MetricTabsChart: ( {
		metrics,
		empty,
	}: {
		metrics: { key: string; countLabel?: ( count: number ) => string }[];
		empty?: ReactNode;
	} ) => (
		<div
			data-testid="metric-tabs-chart"
			data-count-labels={ JSON.stringify(
				Object.fromEntries(
					metrics
						.filter( metric => metric.countLabel )
						.map( metric => [ metric.key, [ metric.countLabel?.( 1 ), metric.countLabel?.( 2 ) ] ] )
				)
			) }
		>
			{ empty }
		</div>
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

	it( 'pluralizes the tooltip unit of every count metric', () => {
		render( <StorePerformanceRender attributes={ {} } /> );

		expect(
			JSON.parse( screen.getByTestId( 'metric-tabs-chart' ).dataset.countLabels ?? '' )
		).toEqual( {
			orders: [ '%s Order', '%s Orders' ],
			bookings: [ '%s Booking', '%s Bookings' ],
			visitors: [ '%s Store visitor', '%s Store visitors' ],
			customers: [ '%s Customer', '%s Customers' ],
		} );
	} );
} );
