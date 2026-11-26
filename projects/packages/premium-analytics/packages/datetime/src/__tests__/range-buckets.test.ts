/**
 * Internal dependencies
 */
import { getRangeBuckets } from '../range-buckets';

describe( 'getRangeBuckets', () => {
	it.each( [
		[
			'days',
			'day',
			{ from: '2026-06-29', to: '2026-07-01' },
			[
				{ date: '2026-06-29', from: '2026-06-29', to: '2026-06-29' },
				{ date: '2026-06-30', from: '2026-06-30', to: '2026-06-30' },
				{ date: '2026-07-01', from: '2026-07-01', to: '2026-07-01' },
			],
		],
		[
			'Monday weeks cut at both ends',
			'week',
			{ from: '2026-06-18', to: '2026-07-01' },
			[
				{ date: '2026-06-15', from: '2026-06-18', to: '2026-06-21' },
				{ date: '2026-06-22', from: '2026-06-22', to: '2026-06-28' },
				{ date: '2026-06-29', from: '2026-06-29', to: '2026-07-01' },
			],
		],
		[
			'months cut at both ends',
			'month',
			{ from: '2025-11-23', to: '2026-01-10' },
			[
				{ date: '2025-11-01', from: '2025-11-23', to: '2025-11-30' },
				{ date: '2025-12-01', from: '2025-12-01', to: '2025-12-31' },
				{ date: '2026-01-01', from: '2026-01-01', to: '2026-01-10' },
			],
		],
		[
			'a range inside one month',
			'month',
			{ from: '2026-02-10', to: '2026-02-20' },
			[ { date: '2026-02-01', from: '2026-02-10', to: '2026-02-20' } ],
		],
		[ 'an inverted range', 'month', { from: '2026-07-10', to: '2026-07-01' }, [] ],
	] as const )( 'covers %s', ( _case, period, range, buckets ) => {
		expect( getRangeBuckets( range, period ) ).toEqual( buckets );
	} );
} );
