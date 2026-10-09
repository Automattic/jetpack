/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { MetricSparklineSkeleton } from '../metric-sparkline-skeleton';

describe( 'MetricSparklineSkeleton', () => {
	it( 'draws the headline count only when the widget renders one', () => {
		// Two of the three widgets show only a value, so a count placeholder
		// would settle into nothing when the data lands.
		const { rerender } = render( <MetricSparklineSkeleton /> );

		expect( screen.queryByTestId( 'skeleton-metric-count' ) ).not.toBeInTheDocument();

		rerender( <MetricSparklineSkeleton withHeadlineCount /> );

		expect( screen.getByTestId( 'skeleton-metric-count' ) ).toBeInTheDocument();
	} );
} );
