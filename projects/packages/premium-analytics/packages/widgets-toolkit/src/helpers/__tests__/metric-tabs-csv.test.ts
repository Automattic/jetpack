/**
 * External dependencies
 */
import { TZDate } from '@date-fns/tz';
/**
 * Internal dependencies
 */
import { buildCsv } from '../build-csv';
import { metricTabsToCsv } from '../metric-tabs-csv';
import type {
	MetricTab,
	MetricTabDatum,
} from '../../components/metric-tabs-chart/metric-tabs-chart';

const ZONE = 'Asia/Taipei';
const DAY_1 = new TZDate( 2026, 2, 1, ZONE );
const DAY_2 = new TZDate( 2026, 2, 2, ZONE );

function tab(
	key: string,
	current: MetricTabDatum[],
	extra: Partial< MetricTab > = {}
): MetricTab {
	return { key, label: key.toUpperCase(), value: null, current, ...extra };
}

function toLines( tabs: MetricTab[], withTime = false ): string[] {
	const { rows, columns } = metricTabsToCsv( tabs, { zone: ZONE, withTime, dateLabel: 'Date' } );

	return buildCsv( columns, rows ).split( '\n' );
}

describe( 'metricTabsToCsv', () => {
	it.each( [
		[
			'one row per bucket, one column per metric in tab order',
			[
				tab( 'views', [
					{ date: DAY_1, value: 5 },
					{ date: DAY_2, value: 7 },
				] ),
				tab( 'visitors', [
					{ date: DAY_2, value: 4 },
					{ date: DAY_1, value: 2 },
				] ),
			],
			[ '"Date","VIEWS","VISITORS"', '"2026-03-01","5","2"', '"2026-03-02","7","4"' ],
		],
		[
			'an empty cell for a bucket with no reading',
			[
				tab( 'views', [
					{ date: DAY_1, value: null },
					{ date: DAY_2, value: 3, missing: true },
				] ),
				tab( 'likes', [ { date: DAY_1, value: 1 } ] ),
			],
			[ '"Date","VIEWS","LIKES"', '"2026-03-01","","1"', '"2026-03-02","",""' ],
		],
		[
			'no column for a metric without a series',
			[
				tab( 'views', [ { date: DAY_1, value: 5 } ] ),
				tab( 'visitors', [], { seriesUnavailable: 'Daily only.' } ),
				tab( 'likes', [], { unavailable: 'Not tracked.' } ),
			],
			[ '"Date","VIEWS"', '"2026-03-01","5"' ],
		],
		[
			'no previous period',
			[
				tab( 'views', [ { date: DAY_1, value: 5 } ], {
					previous: [ { date: DAY_1, value: 9 } ],
					previousValue: 9,
				} ),
			],
			[ '"Date","VIEWS"', '"2026-03-01","5"' ],
		],
	] )( 'writes %s', ( _, tabs, expected ) => {
		expect( toLines( tabs ) ).toEqual( expected );
	} );

	it( 'writes the bucket hour for buckets shorter than a day', () => {
		const lines = toLines(
			[ tab( 'views', [ { date: new TZDate( 2026, 2, 1, 14, ZONE ), value: 2 } ] ) ],
			true
		);

		expect( lines[ 1 ] ).toBe( '"2026-03-01 14:00","2"' );
	} );

	it( 'writes no rows when no metric has a series', () => {
		const { rows } = metricTabsToCsv( [ tab( 'views', [], { unavailable: 'None.' } ) ], {
			zone: ZONE,
			withTime: false,
			dateLabel: 'Date',
		} );

		expect( rows ).toEqual( [] );
	} );
} );
