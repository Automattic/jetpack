/**
 * Internal dependencies
 */
import { pairComparisonBuckets } from '../pair-comparison-buckets';

type Unit = 'week' | 'month' | 'year';

const DAY = 24 * 60 * 60 * 1000;
const day = ( value: string ) => Date.parse( `${ value }T00:00:00Z` );
const stamp = ( ms: number ) => new Date( ms ).toISOString().slice( 0, 19 );

function bucketStart( ms: number, unit: Unit ): number {
	const date = new Date( ms );

	if ( unit === 'month' ) {
		return Date.UTC( date.getUTCFullYear(), date.getUTCMonth(), 1 );
	}

	if ( unit === 'year' ) {
		return Date.UTC( date.getUTCFullYear(), 0, 1 );
	}

	return ms - ( ( date.getUTCDay() + 6 ) % 7 ) * DAY;
}

function nextStart( ms: number, unit: Unit ): number {
	const date = new Date( ms );

	if ( unit === 'month' ) {
		return Date.UTC( date.getUTCFullYear(), date.getUTCMonth() + 1, 1 );
	}

	if ( unit === 'year' ) {
		return Date.UTC( date.getUTCFullYear() + 1, 0, 1 );
	}

	return ms + 7 * DAY;
}

// Calendar buckets with the edges clipped to the range, as the Stats normalizer stamps them.
function buckets( from: number, to: number, unit: Unit ) {
	const rows = [];

	for ( let start = bucketStart( from, unit ); start <= to; start = nextStart( start, unit ) ) {
		rows.push( {
			date_start: stamp( Math.max( start, from ) ),
			date_end: stamp( Math.min( nextStart( start, unit ), to + DAY ) - 1000 ),
		} );
	}

	return rows;
}

function pairRanges( unit: Unit, [ from, to ]: number[], [ compareFrom, compareTo ]: number[] ) {
	const current = buckets( from, to, unit );
	const comparison = buckets( compareFrom, compareTo, unit );
	const pairs = pairComparisonBuckets( current, comparison, {
		current: stamp( from ),
		comparison: stamp( compareFrom ),
	} );

	return { current, comparison, pairs, offset: from - compareFrom };
}

describe( 'pairComparisonBuckets', () => {
	it.each( [
		[
			'skips a stub the comparison opens with',
			'month' as const,
			[ '2025-03-02', '2025-04-02' ],
			[ '2025-01-29', '2025-03-01' ],
			[ 1, 2 ],
		],
		[
			'leaves a stub the current period opens with uncompared',
			'month' as const,
			[ '2025-04-29', '2025-09-23' ],
			[ '2024-12-02', '2025-04-28' ],
			[ undefined, 0, 1, 2, 3, 4 ],
		],
		[
			'pairs weeks of a previous period that do not line up',
			'week' as const,
			[ '2026-09-21', '2026-10-20' ],
			[ '2026-08-22', '2026-09-20' ],
			[ 1, 2, 3, 4, undefined ],
		],
		[
			'skips the one-day week a year-ago comparison opens with',
			'week' as const,
			[ '2026-08-31', '2026-09-13' ],
			[ '2025-08-31', '2025-09-13' ],
			[ 1, 2 ],
		],
		[
			'pairs aligned periods in order',
			'month' as const,
			[ '2026-01-01', '2026-06-30' ],
			[ '2025-01-01', '2025-06-30' ],
			[ 0, 1, 2, 3, 4, 5 ],
		],
		[
			'keeps the smaller shift when two overlap as much',
			'week' as const,
			[ '2026-01-05', '2026-01-16' ],
			[ '2025-12-19', '2025-12-30' ],
			[ 0, 1 ],
		],
	] )( '%s', ( _name, unit, [ from, to ], [ compareFrom, compareTo ], expected ) => {
		const { pairs } = pairRanges(
			unit,
			[ day( from ), day( to ) ],
			[ day( compareFrom ), day( compareTo ) ]
		);

		expect( pairs ).toEqual( expected );
	} );

	it.each( [
		[
			'leaves the hour a spring-forward comparison skips empty',
			[ 0, 1, 2, 3 ],
			[ 0, 1, 3 ],
			[ 0, 1, undefined, 2 ],
		],
		[
			'pairs the hours of a fall-back comparison in order',
			[ 0, 1, 2, 3 ],
			[ 0, 1, 1, 2, 3 ],
			[ 0, 1, 3, 4 ],
		],
	] )( '%s', ( _name, currentHours, comparisonHours, expected ) => {
		const hours = ( date: string, list: number[] ) =>
			list.map( hour => {
				const start = `${ date }T${ String( hour ).padStart( 2, '0' ) }`;
				return { date_start: `${ start }:00:00`, date_end: `${ start }:59:59` };
			} );

		const pairs = pairComparisonBuckets(
			hours( '2026-03-09', currentHours ),
			hours( '2026-03-08', comparisonHours ),
			{ current: '2026-03-09T00:00:00.000-04:00', comparison: '2026-03-08T00:00:00.000-05:00' }
		);

		expect( pairs ).toEqual( expected );
	} );

	it( 'pairs by position when the bounds cannot be read', () => {
		const pairs = pairComparisonBuckets(
			[
				{ date_start: '2026-03-01T00:00:00', date_end: '' },
				{ date_start: '2026-04-01T00:00:00', date_end: '' },
			],
			[ { date_start: '2025-03-01T00:00:00', date_end: '' } ],
			{ current: '2026-03-01', comparison: '2025-03-01' }
		);

		expect( pairs ).toEqual( [ 0, undefined ] );
	} );

	// Whatever the range and comparison, a whole current bucket is never paired with one
	// overlapping it less than half as much as the comparison bucket it overlaps most.
	describe.each( [ 'week' as const, 'month' as const, 'year' as const ] )(
		'across %s ranges',
		unit => {
			const [ minDays, maxDays, step ] = {
				week: [ 28, 365, 11 ],
				month: [ 90, 700, 23 ],
				year: [ 1095, 1600, 41 ],
			}[ unit ];
			const comparisons = {
				'the previous period': ( from: number, to: number ) => [
					from - ( to - from + DAY ),
					from - DAY,
				],
				'the same dates a year earlier': ( from: number, to: number ) =>
					[ from, to ].map( ms => {
						const date = new Date( ms );
						return Date.UTC( date.getUTCFullYear() - 1, date.getUTCMonth(), date.getUTCDate() );
					} ),
				'the previous period matching weekdays': ( from: number, to: number ) => {
					const shift = Math.ceil( ( to - from + DAY ) / DAY / 7 ) * 7 * DAY;
					return [ from - shift, to - shift ];
				},
			};

			it.each( Object.keys( comparisons ) )( 'compared with %s', name => {
				const failures: string[] = [];

				for ( let from = day( '2023-01-01' ); from < day( '2026-12-31' ); from += 5 * DAY ) {
					for ( let length = minDays; length <= maxDays; length += step ) {
						const to = from + ( length - 1 ) * DAY;
						const range = comparisons[ name as keyof typeof comparisons ]( from, to );
						const { current, comparison, pairs, offset } = pairRanges( unit, [ from, to ], range );
						const spans = ( rows: typeof current ) =>
							rows.map( row => ( {
								start: Date.parse( `${ row.date_start }Z` ),
								end: Date.parse( `${ row.date_end }Z` ) + 1000,
							} ) );
						const currentSpans = spans( current );
						const comparisonSpans = spans( comparison ).map( span => ( {
							start: span.start + offset,
							end: span.end + offset,
						} ) );
						const overlap = ( a: { start: number; end: number }, b?: typeof a ) =>
							b ? Math.max( 0, Math.min( a.end, b.end ) - Math.max( a.start, b.start ) ) : 0;
						const paired = pairs.filter( ( index ): index is number => index !== undefined );

						if (
							paired.some( ( index, position ) => position > 0 && index <= paired[ position - 1 ] )
						) {
							failures.push( `${ stamp( from ) } (${ length }d): pairs cross or repeat` );
						}

						currentSpans.forEach( ( span, index ) => {
							const partner = pairs[ index ];
							const partnerOverlap =
								partner === undefined ? 0 : overlap( span, comparisonSpans[ partner ] );
							const best = Math.max( 0, ...comparisonSpans.map( other => overlap( span, other ) ) );
							const isWhole =
								bucketStart( span.start, unit ) === span.start &&
								nextStart( span.start, unit ) === span.end;

							if ( partner !== undefined && partnerOverlap === 0 ) {
								failures.push( `${ stamp( from ) } (${ length }d): paired without overlap` );
							}

							if ( isWhole && partnerOverlap < best / 2 ) {
								failures.push( `${ stamp( from ) } (${ length }d): ${ stamp( span.start ) }` );
							}
						} );
					}
				}

				expect( failures ).toEqual( [] );
			} );
		}
	);
} );
