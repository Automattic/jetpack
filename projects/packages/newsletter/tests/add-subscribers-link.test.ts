// The Add Subscribers deep link is a two-ended contract: the Newsletter Mode
// dashboard writes it, `SubscribersBody` reads it. Both ends live in
// `add-subscribers-link.ts`, so the round trip is what matters here — plus the
// bare `#add-subscribers` form, which predates tabs being addressable and has
// to keep working.

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getAdminUrl: ( path: string ) => `https://example.com/wp-admin/${ path }`,
} ) );

import {
	getAddSubscribersUrl,
	readAddSubscribersHash,
} from '../_inc/subscribers/lib/add-subscribers-link';

describe( 'Add Subscribers deep link', () => {
	it.each( [ 'manual', 'upload', 'substack' ] as const )( 'round-trips the %s tab', tab => {
		const hash = new URL( getAddSubscribersUrl( tab ) ).hash;

		expect( readAddSubscribersHash( hash ) ).toEqual( { open: true, tab } );
	} );

	it( 'points at the Newsletter admin page', () => {
		expect( getAddSubscribersUrl( 'upload' ) ).toBe(
			'https://example.com/wp-admin/admin.php?page=jetpack-newsletter#add-subscribers=upload'
		);
	} );

	it( 'defaults to the manual tab', () => {
		expect( getAddSubscribersUrl() ).toContain( '#add-subscribers=manual' );
	} );

	it( 'still honors the bare hash written before tabs were addressable', () => {
		expect( readAddSubscribersHash( '#add-subscribers' ) ).toEqual( {
			open: true,
			tab: 'manual',
		} );
	} );

	it( 'falls back to the manual tab when the hash names one that does not exist', () => {
		expect( readAddSubscribersHash( '#add-subscribers=nope' ) ).toEqual( {
			open: true,
			tab: 'manual',
		} );
	} );

	it.each( [ '', '#', '#subscribers', '#add-subscribers-modal', '#add-subscribers=' ] )(
		'does not open for %p',
		hash => {
			expect( readAddSubscribersHash( hash ).open ).toBe( false );
		}
	);
} );
