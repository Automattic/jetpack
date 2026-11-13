import { seedDetailDateParams } from './detail-date-seed';

describe( 'seedDetailDateParams', () => {
	beforeEach( () => {
		jest.useFakeTimers().setSystemTime( new Date( '2026-06-16T12:00:00Z' ) );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it.each( [
		[
			'a preset and its range',
			{ preset: 'last-7-days', from: '2026-06-10T00:00:00', to: '2026-06-16T23:59:59' },
		],
		[ 'a preset alone', { preset: 'last-7-days' } ],
		[ 'a year preset alone', { preset: 'year-2025' } ],
	] )( 'opens a link carrying %s on that preset and keeps it for the way back', ( _, search ) => {
		const seeded = seedDetailDateParams( search, '42' );

		expect( seeded ).toMatchObject( { preset: search.preset, ref_preset: search.preset } );
	} );

	it( 'opens a link in on the linking custom range, keeping its bucket and comparison for the way back', () => {
		const seeded = seedDetailDateParams(
			{
				from: '2026-03-01T00:00:00',
				to: '2026-05-31T23:59:59',
				interval: 'month',
				comp: '1',
				compare_from: '2025-03-01T00:00:00',
				compare_to: '2025-05-31T23:59:59',
			},
			'42'
		);

		expect( seeded ).toMatchObject( {
			from: '2026-03-01T00:00:00',
			to: '2026-05-31T23:59:59',
			interval: 'week',
			ref_interval: 'month',
			ref_compare_from: '2025-03-01T00:00:00',
		} );
		expect( seeded ).not.toHaveProperty( 'comp' );
		expect( seeded.preset ).toBeUndefined();
	} );

	it.each( [
		[ 'no window', { ds: 'traffic' } ],
		[ 'an unknown preset', { preset: 'bogus' } ],
		[
			'all time from another entity',
			{ preset: 'all-time', from: '2019-05-02T00:00:00', to: '2026-06-16T23:59:59' },
		],
	] )( 'opens a link with %s on all time from the provisional start', ( _, search ) => {
		const seeded = seedDetailDateParams( search, '42' );

		expect( seeded.preset ).toBe( 'all-time' );
		expect( seeded.from ).not.toBe( '2019-05-02T00:00:00' );
	} );
} );
