import { getAdminPageSlug } from '../sidebar-highlight';

// The check is same-origin, so build the fixtures from wherever the test runs.
const origin = () => window.location.origin;

describe( 'getAdminPageSlug', () => {
	it( 'reads the page slug from a wp-admin URL', () => {
		expect( getAdminPageSlug( `${ origin() }/wp-admin/admin.php?page=jetpack-forms` ) ).toBe(
			'jetpack-forms'
		);
	} );

	it( 'keeps the slug when the URL carries other parameters', () => {
		expect(
			getAdminPageSlug(
				`${ origin() }/wp-admin/admin.php?page=jetpack-forms&p=%2Fresponses%2Finbox`
			)
		).toBe( 'jetpack-forms' );
	} );

	it( 'ignores a URL that leaves this site', () => {
		// Backup manages itself on jetpack.com, so there is no menu item to point at.
		// The page parameter is deliberate: without it this passes whether or not the
		// origin is actually checked.
		expect(
			getAdminPageSlug( 'https://jetpack.com/wp-admin/admin.php?page=jetpack-forms' )
		).toBeNull();
	} );

	it( 'ignores a URL outside wp-admin', () => {
		expect( getAdminPageSlug( `${ origin() }/some-page/?page=jetpack-forms` ) ).toBeNull();
	} );

	it( 'ignores a wp-admin URL with no page parameter', () => {
		expect( getAdminPageSlug( `${ origin() }/wp-admin/index.php` ) ).toBeNull();
	} );

	it( 'ignores an empty or unparseable URL', () => {
		expect( getAdminPageSlug( '' ) ).toBeNull();
		expect( getAdminPageSlug( '://nope' ) ).toBeNull();
	} );
} );
