/**
 * Internal dependencies
 */
import { formatBucketTooltipDate } from '../format-bucket-tooltip-date';

const at = ( stamp: string ) => new Date( `${ stamp }Z` );
const SEP = '\u2009\u2013\u2009';

describe( 'formatBucketTooltipDate', () => {
	it.each( [
		[
			'names both ends of a week',
			{ date: at( '2026-09-21T00:00:00' ), endDate: at( '2026-09-27T23:59:59' ) },
			'day' as const,
			`September 21${ SEP }27, 2026`,
		],
		[
			"names a comparison week by its own dates, not the axis slot's",
			{
				date: at( '2026-09-21T00:00:00' ),
				realDate: at( '2025-09-22T00:00:00' ),
				endDate: at( '2025-09-28T23:59:59' ),
			},
			'day' as const,
			`September 22${ SEP }28, 2025`,
		],
		[
			'names a day by its date alone',
			{ date: at( '2026-09-21T00:00:00' ), endDate: at( '2026-09-21T23:59:59' ) },
			'day' as const,
			'September 21, 2026',
		],
		[
			'keeps a month on its start date',
			{ date: at( '2026-09-01T00:00:00' ), endDate: at( '2026-09-30T23:59:59' ) },
			'month' as const,
			'September 1, 2026',
		],
	] )( '%s', ( _name, datum, resolution, expected ) => {
		expect( formatBucketTooltipDate( datum, resolution ) ).toBe( expected );
	} );
} );
