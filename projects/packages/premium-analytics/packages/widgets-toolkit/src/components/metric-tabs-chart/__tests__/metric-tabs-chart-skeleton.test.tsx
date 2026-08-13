/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { MetricTabsChartSkeleton } from '../metric-tabs-chart-skeleton';

describe( 'MetricTabsChartSkeleton', () => {
	it( 'draws a single chart block inside a status region', () => {
		render( <MetricTabsChartSkeleton /> );

		expect( screen.getByRole( 'status' ) ).toBeInTheDocument();
		expect( screen.getAllByTestId( 'skeleton-chart-block' ) ).toHaveLength( 1 );
	} );

	it( 'draws no metric card placeholders', () => {
		// The card count is only known once data lands, and the real header
		// collapses to a dropdown at a width the skeleton cannot predict, so a
		// card-shaped stand-in would land as a jump rather than prevent one.
		render( <MetricTabsChartSkeleton /> );

		// `SkeletonRoot`'s visually hidden label, then the chart block — nothing
		// else. Counting is the only assertion that catches a re-added card: a
		// bare `<Skeleton>` carries no role or testid to query for.
		// eslint-disable-next-line testing-library/no-node-access -- see above.
		expect( screen.getByRole( 'status' ).children ).toHaveLength( 2 );
	} );
} );
