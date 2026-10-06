/**
 * Internal dependencies
 */
import { getComparisonBucketShift, type BucketSpan } from '../comparison-bucket-shift';

const spans = ( ...ranges: Array< [ string, string ] > ): BucketSpan[] =>
	ranges.map( ( [ from, to ] ) => ( {
		date: new Date( `${ from }T00:00:00Z` ),
		endDate: new Date( `${ to }T23:59:59Z` ),
	} ) );

// Weeks run Monday to Sunday; edge weeks are clipped to the range.
const CURRENT_FROM_MONDAY = spans(
	[ '2026-08-31', '2026-09-06' ],
	[ '2026-09-07', '2026-09-13' ],
	[ '2026-09-14', '2026-09-20' ]
);

describe( 'getComparisonBucketShift', () => {
	it.each( [
		[
			'skips the one-day week a Sunday-start comparison opens with',
			CURRENT_FROM_MONDAY,
			spans(
				[ '2025-08-31', '2025-08-31' ],
				[ '2025-09-01', '2025-09-07' ],
				[ '2025-09-08', '2025-09-14' ],
				[ '2025-09-15', '2025-09-20' ]
			),
			1,
		],
		[
			'keeps an extra trailing week in place',
			spans( [ '2026-09-08', '2026-09-13' ], [ '2026-09-14', '2026-09-20' ] ),
			spans(
				[ '2026-08-12', '2026-08-16' ],
				[ '2026-08-17', '2026-08-23' ],
				[ '2026-08-24', '2026-08-24' ]
			),
			0,
		],
		[
			'pairs by index when both periods have as many buckets',
			CURRENT_FROM_MONDAY,
			spans(
				[ '2025-09-01', '2025-09-07' ],
				[ '2025-09-08', '2025-09-14' ],
				[ '2025-09-15', '2025-09-21' ]
			),
			0,
		],
		[
			'pairs by index when the buckets carry no end',
			CURRENT_FROM_MONDAY,
			[ '2025-08-31', '2025-09-01', '2025-09-08', '2025-09-15' ].map( day => ( {
				date: new Date( `${ day }T00:00:00Z` ),
			} ) ),
			0,
		],
	] )( '%s', ( _name, primary, comparison, expected ) => {
		expect( getComparisonBucketShift( primary, comparison ) ).toBe( expected );
	} );
} );
