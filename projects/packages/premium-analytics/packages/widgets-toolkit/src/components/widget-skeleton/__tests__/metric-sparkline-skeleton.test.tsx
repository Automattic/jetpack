/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { MetricSparklineSkeleton } from '../metric-sparkline-skeleton';

describe( 'MetricSparklineSkeleton', () => {
	it( 'draws the headline and the sparkline band in a status region', () => {
		render( <MetricSparklineSkeleton /> );

		expect( screen.getByRole( 'status' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'skeleton-metric-value' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'skeleton-chart-block' ) ).toBeInTheDocument();
	} );

	it( 'leaves out the headline count unless the widget renders one', () => {
		// Two of the three widgets show only a value, so a count placeholder
		// would settle into nothing when the data lands.
		render( <MetricSparklineSkeleton /> );

		expect( screen.queryByTestId( 'skeleton-metric-count' ) ).not.toBeInTheDocument();
	} );

	it( 'draws the headline count between the value and the chart when asked', () => {
		render( <MetricSparklineSkeleton withHeadlineCount /> );

		const value = screen.getByTestId( 'skeleton-metric-value' );
		const count = screen.getByTestId( 'skeleton-metric-count' );
		const chart = screen.getByTestId( 'skeleton-chart-block' );

		expect( value.compareDocumentPosition( count ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
		expect( count.compareDocumentPosition( chart ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );

	it( 'puts the sparkline band after the headline', () => {
		// Order is the whole point of a content-shaped skeleton: the widgets it
		// stands in for render the value above the chart.
		render( <MetricSparklineSkeleton /> );

		const value = screen.getByTestId( 'skeleton-metric-value' );
		const chart = screen.getByTestId( 'skeleton-chart-block' );

		expect( value.compareDocumentPosition( chart ) ).toBe( Node.DOCUMENT_POSITION_FOLLOWING );
	} );
} );
