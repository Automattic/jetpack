import {
	fromRouteSearch,
	getLegacyHashHref,
	getMyJetpackRouteUrl,
	toRouteHref,
} from '../route-href';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getMyJetpackUrl: ( section = '' ) =>
		`http://example.org/wp-admin/admin.php?page=my-jetpack${ section }`,
} ) );

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

describe( 'toRouteHref', () => {
	it.each( [
		[ '?search=1.0', '/features?search=%221.0%22' ],
		[ '?search=12+', '/features?search=%2212+%22' ],
		[ '?search=stats&view=list', '/features?search=stats&view=list' ],
		[ '', '/features' ],
	] )( 'keeps %p a string by writing %p', ( search, href ) => {
		expect( toRouteHref( { pathname: '/features', search } ) ).toBe( href );
	} );
} );

describe( 'fromRouteSearch', () => {
	it( 'hands the parsed values back as strings', () => {
		expect(
			fromRouteSearch( { search: '1.0', skip_pricing: true, page: 2, feature: undefined } )
		).toBe( '?search=1.0&skip_pricing=true&page=2' );
	} );
} );

describe( 'getMyJetpackRouteUrl', () => {
	it.each( [
		[ '?page=my-jetpack&p=%2Foverview', '#/add-license' ],
		[ '?page=jetpack-boost', 'http://example.org/wp-admin/admin.php?page=my-jetpack#/add-license' ],
	] )( 'on %s links to %s', ( query, href ) => {
		window.history.replaceState( null, '', `/wp-admin/admin.php${ query }` );

		expect( getMyJetpackRouteUrl( '/add-license' ) ).toBe( href );
	} );
} );
