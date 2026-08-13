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
		render( <MetricTabsChartSkeleton /> );

		// eslint-disable-next-line testing-library/no-node-access -- child count is the assertion.
		expect( screen.getByRole( 'status' ).children ).toHaveLength( 2 );
	} );
} );
