/**
 * Internal dependencies
 */
import { cleanLocale } from '../';

describe( 'cleanLocale', () => {
	const wpLocales = [
		[ 'en_US', 'en-US' ],
		[ 'de_DE_formal', 'de-DE' ],
		[ 'en', 'en' ],
	];

	it.each( wpLocales )( 'WP locale %s is returned as %s', ( value, expected ) => {
		expect( cleanLocale( value ) ).toStrictEqual( expected );
	} );
} );
