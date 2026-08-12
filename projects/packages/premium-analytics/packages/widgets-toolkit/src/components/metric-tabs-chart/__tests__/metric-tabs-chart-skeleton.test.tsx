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
		const { container } = render( <MetricTabsChartSkeleton /> );

		expect( screen.queryByTestId( 'skeleton-line' ) ).not.toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- the absence of a container-query key is the assertion; there is no element to query for.
		expect( container.querySelector( '[data-tabs]' ) ).toBeNull();
	} );
} );
