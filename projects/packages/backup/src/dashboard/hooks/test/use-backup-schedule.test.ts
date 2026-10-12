import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import { scheduleOptions } from '../use-backup-schedule';

afterEach( () => {
	resetLocaleData();
} );

describe( 'scheduleOptions', () => {
	it.each( [
		[ 'g:i a', '10:00-10:59 am' ],
		[ 'A g:i', 'AM 10:00-AM 10:59' ],
		[ 'H:i', '10:00-10:59' ],
	] )( 'labels the windows in the translated time format %s', ( format, expected ) => {
		setLocaleData( { 'g:i A': [ format ] }, 'jetpack-backup-pkg' );

		const labels = scheduleOptions( new Date( '2026-10-22T12:00:00Z' ) ).map( o => o.label );

		expect( labels[ 10 ] ).toBe( expected );
	} );
} );
