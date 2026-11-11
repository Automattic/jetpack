// eslint-disable-next-line import/no-unresolved -- Core's script module, mocked below.
import { speak } from '@wordpress/a11y';
import { announcePage } from '../../../src/admin-shell/chrome';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ), { virtual: true } );

describe( 'announcePage', () => {
	it( 'speaks each page title politely', async () => {
		announcePage( 'Jetpack Forms ‹ Site — WordPress' );
		announcePage( 'My Jetpack ‹ Site — WordPress' );

		await new Promise( resolve => setTimeout( resolve ) );
		expect( speak.mock.calls ).toEqual( [
			[ 'Jetpack Forms ‹ Site — WordPress', 'polite' ],
			[ 'My Jetpack ‹ Site — WordPress', 'polite' ],
		] );
	} );
} );
