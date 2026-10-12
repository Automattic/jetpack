import { resetLocaleData, setLocaleData } from '@wordpress/i18n';
import { formatDate, formatDateTime, formatTime } from '../date-format';

afterEach( () => {
	resetLocaleData();
} );

describe( 'date formats', () => {
	it( 'renders English in the compact US form', () => {
		expect( formatDateTime( '2026-08-12T17:20:00Z' ) ).toBe( 'Aug 12, 2026, 5:20 PM' );
	} );

	it( 'follows the translated format, so a 24-hour locale never sees AM or PM', () => {
		setLocaleData(
			{
				'M j, Y, g:i A': [ 'j M Y, H:i' ],
				'M j, Y': [ 'j M Y' ],
				'g:i A': [ 'H:i' ],
			},
			'jetpack-backup-pkg'
		);

		expect( formatDateTime( '2026-08-12T17:20:00Z' ) ).toBe( '12 Aug 2026, 17:20' );
		expect( formatDate( '2026-08-12T17:20:00Z' ) ).toBe( '12 Aug 2026' );
		expect( formatTime( '2026-08-12T17:20:00Z' ) ).toBe( '17:20' );
	} );
} );
