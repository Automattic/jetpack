import { seedDetailDateParams } from './detail-date-seed';

describe( 'seedDetailDateParams', () => {
	beforeEach( () => {
		jest.useFakeTimers().setSystemTime( new Date( '2026-06-16T12:00:00Z' ) );
	} );

	afterEach( () => {
		jest.useRealTimers();
	} );

	it( 'opens a link in on the linking preset and keeps it for the way back', () => {
		const seeded = seedDetailDateParams(
			{ preset: 'last-7-days', from: '2026-06-10T00:00:00', to: '2026-06-16T23:59:59' },
			'42'
		);

		expect( seeded ).toMatchObject( { preset: 'last-7-days', ref_preset: 'last-7-days' } );
	} );

	it( 'opens a link in on the linking custom range and interval, without its comparison', () => {
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
			interval: 'month',
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
