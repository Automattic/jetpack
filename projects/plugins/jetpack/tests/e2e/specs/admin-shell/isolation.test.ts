import { test, expect } from '@playwright/test';
import {
	MEMBERS,
	installShellProbe,
	openMember,
	settle,
	startFrames,
	stopFrames,
	switchTo,
	waitForShown,
} from '../../helpers/admin-shell-helper';

/* A tour that passes through both hash routers and both `p` routers. */
const TOUR = [
	'jetpack-settings',
	'jetpack-forms-responses-wp-admin',
	'jetpack-newsletter',
	'my-jetpack',
	'jetpack-ai',
	'jetpack-podcast',
	'my-jetpack',
];

test.describe( 'Admin shell: hidden apps stay out of the way', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	test( 'no member URL ever carries another member’s route', async ( { page } ) => {
		test.fail(
			true,
			'Known spike bug: routes leak between apps (seen: Forms’ p=/forms on Newsletter).'
		);
		await openMember( page, 'jetpack-podcast' );
		await startFrames( page );
		for ( const slug of TOUR ) {
			await switchTo( page, slug );
			await settle( page, 2000 );
		}
		const urls = [ ...new Set( ( await stopFrames( page ) ).map( f => f.href ) ) ];
		const stray = urls.filter( href => {
			const slug = new URLSearchParams( href.split( '#' )[ 0 ] ).get( 'page' );
			const own = MEMBERS.find( m => m.slug === slug );
			// Only a member's own routes may appear: hashes for hash routers, `p` for path routers.
			const ownRoutes: Record< string, RegExp > = {
				'my-jetpack': /^\?page=my-jetpack(#\/[a-z-]+)?$/,
				'jetpack-settings': /^\?page=jetpack-settings(#\/[a-z-]+)?$/,
				'jetpack-ai': /^\?page=jetpack-ai(#\/[a-z-]+)?$/,
				'jetpack-forms-responses-wp-admin':
					/^\?page=jetpack-forms-responses-wp-admin(&p=%2F(forms|responses)[^#&]*)?$/,
				'jetpack-newsletter': /^\?page=jetpack-newsletter(&p=%2F%3Ftab%3D[a-z]+)?$/,
			};
			return own && ! ( ownRoutes[ own.slug ] ?? own.landing ).test( href );
		} );
		expect( stray, 'URLs written with another app’s route' ).toEqual( [] );
	} );

	test( 'a hidden app’s portals hide with it', async ( { page } ) => {
		await openMember( page, 'jetpack-newsletter' );
		await switchTo( page, 'jetpack-forms-responses-wp-admin' );
		await page.getByRole( 'button', { name: 'Create a form' } ).filter( { visible: true } ).click();
		const dialog = page.getByRole( 'dialog' );
		await expect( dialog ).toBeVisible();

		// The modal covers the sidebar, so leave through Back.
		await page.goBack();
		await waitForShown( page, 'jetpack-newsletter' );
		await expect( dialog ).toBeHidden();
	} );
} );
