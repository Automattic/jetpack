/**
 * Internal dependencies
 */
import { DEFAULT_REFETCH_INTERVAL } from '../../utils/refetch-interval';
import {
	statsEmailClicksTimeSeriesQuery,
	statsEmailOpensTimeSeriesQuery,
} from '../stats-email-time-series-query';
import { statsStreakQuery } from '../stats-streak-query';
import { statsVisitsQuery } from '../stats-visits-query';

const interval = ( query: { refetchInterval?: unknown } ) =>
	( query.refetchInterval as () => number | false )();

describe( 'Stats queries stop polling a window that ended before today', () => {
	beforeEach( () => {
		jest.useFakeTimers( { now: new Date( '2026-09-30T12:00:00Z' ) } );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	const current = { from: '2026-09-24', to: '2026-09-30', interval: 'day' } as const;
	const past = { from: '2026-08-01', to: '2026-08-31', interval: 'day' } as const;

	it.each( [
		[ 'visits', ( range: typeof current | typeof past ) => statsVisitsQuery( range ) ],
		[ 'streak', ( range: typeof current | typeof past ) => statsStreakQuery( range ) ],
		[
			'email opens',
			( range: typeof current | typeof past ) => statsEmailOpensTimeSeriesQuery( 41, range ),
		],
		[
			'email clicks',
			( range: typeof current | typeof past ) => statsEmailClicksTimeSeriesQuery( 41, range ),
		],
	] )( '%s: polls a range that includes today and not a finished one', ( _name, build ) => {
		expect( interval( build( current ) ) ).toBe( DEFAULT_REFETCH_INTERVAL );
		expect( interval( build( past ) ) ).toBe( false );
	} );
} );
