/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import BookingsOverTimeRender from '../render';

jest.mock( '@wordpress/route', () => jest.requireActual( '../../test-utils' ).mockWordPressRoute );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	BookingOrderMetricWidget: ( {
		seriesCountLabel,
	}: {
		seriesCountLabel?: ( count: number ) => string;
	} ) => (
		<div
			data-testid="metric-widget"
			data-count-labels={ `${ seriesCountLabel?.( 1 ) }|${ seriesCountLabel?.( 2 ) }` }
		/>
	),
} ) );

describe( 'BookingsOverTimeRender', () => {
	it( 'pluralizes the tooltip unit', () => {
		render( <BookingsOverTimeRender attributes={ {} } /> );

		expect( screen.getByTestId( 'metric-widget' ) ).toHaveAttribute(
			'data-count-labels',
			'%s Booking|%s Bookings'
		);
	} );
} );
