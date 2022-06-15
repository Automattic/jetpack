import { cleanLocale } from '../';

describe( 'cleanLocale', () => {
	const testLocales = [
		[ 'af', 'af' ],
		[ 'arq', 'arq' ],
		[ 'fr_FR', 'fr-FR' ],
		[ 'pap_CW', 'pap-CW' ],
		[ 'de_DE_formal', 'de-DE' ],
		[ 'art_xpirate', 'art-xpirate' ],
		[ 'art_xemoji', 'art-xemoji' ],
		[ 'pt_PT_ao90', 'pt-PT' ],
		[ 'deDE', 'en-US' ],
		[ 'foobarde_DE', 'en-US' ], // Language should never be more than 3 chars long.
		[ 'en_alotofchars', 'en' ], // region or variant tags should not be more than 8 chars.
	];

	it.each( testLocales )( '%s is cleaned into %s', ( from, to ) => {
		expect( cleanLocale( from ) ).toBe( to );
	} );
} );
