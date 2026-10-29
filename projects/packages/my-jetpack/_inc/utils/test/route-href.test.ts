import { getLegacyHashHref } from '../route-href';

describe( 'getLegacyHashHref', () => {
	it.each( [
		[ '#/add-backup', '/add-backup' ],
		[ '#/connection?skip_pricing=true', '/connection?skip_pricing=true' ],
		[ '#/features?search=404&feature=stats', '/features?search=404&feature=stats' ],
		[ '#/add-protect/scan', '/add-protect/scan' ],
		[ '#/?reload=true', '/?reload=true' ],
	] )( 'redirects %s to %s', ( hash, href ) => {
		expect( getLegacyHashHref( hash ) ).toBe( href );
	} );

	it.each( [ '', '#', '#/', '#wpbody-content' ] )( 'leaves %p alone', hash => {
		expect( getLegacyHashHref( hash ) ).toBeNull();
	} );
} );
