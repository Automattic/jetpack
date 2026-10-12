import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import { scheduleOptions } from '../use-backup-schedule';

afterEach( () => {
	resetLocaleData();
} );

describe( 'scheduleOptions', () => {
	it( 'labels the windows in the translated time format', () => {
		setLocaleData( { 'g:i A': [ 'H:i' ] }, 'jetpack-backup-pkg' );

		const labels = scheduleOptions( new Date( '2026-10-22T12:00:00Z' ) ).map( o => o.label );

		expect( labels[ 10 ] ).toBe( '10:00-10:59' );
		expect( labels[ 23 ] ).toBe( '23:00-23:59' );
	} );
} );
