/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
/**
 * Internal dependencies
 */
import BookingsOverTimeRender from '../bookings-over-time/render';
import OrdersOverTimeRender from '../orders-over-time/render';
import VisitorsOverTimeRender from '../visitors-over-time/render';
import type { ComponentType } from 'react';

jest.mock( '@wordpress/api-fetch', () => jest.fn( () => new Promise( () => {} ) ) );

jest.mock( '@wordpress/route', () => jest.requireActual( '../test-utils' ).mockWordPressRoute );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => {
	const MetricWidget = ( {
		seriesCountLabel,
	}: {
		seriesCountLabel?: ( count: number ) => string;
	} ) => (
		<div
			data-testid="metric-widget"
			data-count-labels={ `${ seriesCountLabel?.( 1 ) }|${ seriesCountLabel?.( 2 ) }` }
		/>
	);

	return {
		...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
		BookingOrderMetricWidget: MetricWidget,
		OrderMetricWidget: MetricWidget,
		ReportMetricWidget: MetricWidget,
	};
} );

describe( 'over-time widgets', () => {
	it.each( [
		[ 'BookingsOverTimeRender', BookingsOverTimeRender, '%s Booking|%s Bookings' ],
		[ 'OrdersOverTimeRender', OrdersOverTimeRender, '%s Order|%s Orders' ],
		[ 'VisitorsOverTimeRender', VisitorsOverTimeRender, '%s Visitor|%s Visitors' ],
	] as [ string, ComponentType< { attributes: object } >, string ][] )(
		'%s pluralizes the tooltip unit',
		( _name, Render, countLabels ) => {
			render( <Render attributes={ {} } /> );

			expect( screen.getByTestId( 'metric-widget' ) ).toHaveAttribute(
				'data-count-labels',
				countLabels
			);
		}
	);
} );
