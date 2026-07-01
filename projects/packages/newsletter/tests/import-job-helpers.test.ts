import { isJobInProgress, isJobStale } from '../_inc/subscribers/data/use-import-jobs';
import type { ImportJob } from '../_inc/subscribers/data/types';

const HOUR_IN_MS = 60 * 60 * 1000;
const NOW = new Date( '2026-06-10T12:00:00' ).getTime();

const job = ( overrides: Partial< ImportJob > ): ImportJob => ( {
	id: 1,
	status: 'pending',
	...overrides,
} );

describe( 'isJobInProgress', () => {
	it.each( [ 'pending', 'importing' ] as const )( 'is true for %s jobs', status => {
		expect( isJobInProgress( job( { status } ) ) ).toBe( true );
	} );

	it.each( [ 'imported', 'failed', 'cancelled' ] as const )( 'is false for %s jobs', status => {
		expect( isJobInProgress( job( { status } ) ) ).toBe( false );
	} );
} );

describe( 'isJobStale', () => {
	// `scheduled_at` arrives in WP.com's space-separated format with no timezone marker
	// (e.g. `2026-06-10 18:08:55`), which `new Date()` parses as local time — so format these
	// fixtures in local time too, keeping the test independent of the runner's TZ.
	const scheduledHoursAgo = ( hours: number ): string => {
		const d = new Date( NOW - hours * HOUR_IN_MS );
		const pad = ( n: number ) => String( n ).padStart( 2, '0' );
		return `${ d.getFullYear() }-${ pad( d.getMonth() + 1 ) }-${ pad( d.getDate() ) } ${ pad(
			d.getHours()
		) }:${ pad( d.getMinutes() ) }:${ pad( d.getSeconds() ) }`;
	};

	it( 'is false while an in-progress job is under the 24h threshold', () => {
		expect( isJobStale( job( { scheduled_at: scheduledHoursAgo( 23 ) } ), NOW ) ).toBe( false );
	} );

	it( 'is true once an in-progress job passes the 24h threshold', () => {
		expect( isJobStale( job( { scheduled_at: scheduledHoursAgo( 25 ) } ), NOW ) ).toBe( true );
	} );

	it( 'is false for completed jobs no matter how old', () => {
		expect(
			isJobStale( job( { status: 'imported', scheduled_at: scheduledHoursAgo( 100 ) } ), NOW )
		).toBe( false );
	} );

	it( 'is false when the job has no scheduled_at to compare against', () => {
		expect( isJobStale( job( {} ), NOW ) ).toBe( false );
	} );
} );
