import { lastDaysReportDates, toStatsPeriod } from '../stats-period';

describe( 'toStatsPeriod', () => {
	it.each( [
		[
			'a range of datetimes',
			'2026-06-01T00:00:00',
			'2026-06-07T23:59:59',
			{ to: '2026-06-07', days: 7 },
		],
		[ 'a single day', '2026-06-07', '2026-06-07', { to: '2026-06-07', days: 1 } ],
		[
			'a range past the year the endpoint serves',
			'2024-01-01',
			'2026-06-07',
			{ to: '2026-06-07', days: 365 },
		],
		[ 'dates out of order', '2026-06-08', '2026-06-07', undefined ],
		[ 'a missing date', undefined, '2026-06-07', undefined ],
		[ 'a value that is not a date', 'last-week', '2026-06-07', undefined ],
	] )( 'reads %s', ( _case, from, to, expected ) => {
		expect( toStatsPeriod( from, to ) ).toEqual( expected );
	} );
} );

describe( 'lastDaysReportDates', () => {
	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'spans the days up to today, in the form toStatsPeriod reads back', () => {
		jest.useFakeTimers().setSystemTime( new Date( '2026-06-07T15:00:00Z' ) );

		const dates = lastDaysReportDates( 30 );

		expect( dates ).toEqual( { from: '2026-05-09T00:00:00', to: '2026-06-07T23:59:59' } );
		expect( toStatsPeriod( dates.from, dates.to ) ).toEqual( { to: '2026-06-07', days: 30 } );
	} );
} );
