/**
 * Internal dependencies
 */
import { STORE_PERFORMANCE_METRICS } from '../metrics';

describe( 'STORE_PERFORMANCE_METRICS', () => {
	it( 'pluralizes the tooltip unit of every count metric', () => {
		const countLabels = Object.fromEntries(
			STORE_PERFORMANCE_METRICS.filter( metric => metric.countLabel ).map( metric => [
				metric.id,
				[ metric.countLabel?.( 1 ), metric.countLabel?.( 2 ) ],
			] )
		);

		expect( countLabels ).toEqual( {
			orders: [ '%s Order', '%s Orders' ],
			bookings: [ '%s Booking', '%s Bookings' ],
			visitors: [ '%s Visitor', '%s Visitors' ],
			customers: [ '%s Customer', '%s Customers' ],
		} );
	} );
} );
