/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { MetricTabsChartSkeleton } from '../metric-tabs-chart-skeleton';

/**
 * The header carrying the container-query key. It has no accessible name of its
 * own, and the attribute is the contract between the shape and its stylesheet.
 *
 * @return The element whose `data-tabs` the stylesheet keys off.
 */
function skeletonHeader(): HTMLElement | null {
	return screen.getByRole( 'status' ).querySelector( '[data-tabs]' );
}

describe( 'MetricTabsChartSkeleton', () => {
	it( 'keys the header off the tab count', () => {
		render( <MetricTabsChartSkeleton tabs={ 3 } /> );

		expect( skeletonHeader() ).toHaveAttribute( 'data-tabs', '3' );
	} );

	it( 'collapses tab counts past the widest rule onto it', () => {
		// The stylesheet stops at six; more tabs share the widest threshold
		// rather than falling through to the card grid on every width.
		render( <MetricTabsChartSkeleton tabs={ 9 } /> );

		expect( skeletonHeader() ).toHaveAttribute( 'data-tabs', '6' );
	} );
} );
