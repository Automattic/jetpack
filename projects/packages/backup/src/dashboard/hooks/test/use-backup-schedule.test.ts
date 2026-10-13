import { getSettings, setSettings } from '@wordpress/date';
import { scheduleOptions } from '../use-backup-schedule';

const original = getSettings();

afterEach( () => {
	setSettings( original );
} );

describe( 'scheduleOptions', () => {
	it.each( [
		[ 'g:i a', '10:00-10:59 am' ],
		[ 'g:i A', '10:00-10:59 AM' ],
		[ 'A g:i', 'AM 10:00-AM 10:59' ],
		[ 'H:i', '10:00-10:59' ],
	] )( 'labels the windows in the site time format %s', ( time, expected ) => {
		setSettings( { ...original, formats: { ...original.formats, time } } );

		const labels = scheduleOptions( new Date( '2026-10-22T12:00:00Z' ) ).map( o => o.label );

		expect( labels[ 10 ] ).toBe( expected );
	} );
} );
