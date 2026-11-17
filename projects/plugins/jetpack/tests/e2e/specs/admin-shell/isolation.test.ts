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

const FORMS = 'jetpack-forms-responses-wp-admin';

/* Back and forth, so each app is hidden while the other writes its routes. */
const TOUR = [ 'my-jetpack', FORMS, 'my-jetpack', FORMS ];

/* A member's own routes: its `p` path, nothing else. */
const OWN_ROUTES: Record< string, RegExp > = {
	'my-jetpack': /^\?page=my-jetpack(&p=%2F[a-z-]+(%3F[^#&]*)?)?$/,
	[ FORMS ]: /^\?page=jetpack-forms-responses-wp-admin(&p=%2F(forms|responses)[^#&]*)?$/,
};

test.describe( 'Admin shell: hidden apps stay out of the way', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	test( 'no member URL ever carries another member’s route', async ( { page } ) => {
		await openMember( page, FORMS );
		await startFrames( page );
		for ( const slug of TOUR ) {
			await switchTo( page, slug );
			await settle( page, 2000 );
		}
		const frames = await stopFrames( page );
		// A full load mid-tour would reset the recording and pass vacuously.
		expect( frames[ 0 ]?.href, 'recorded from the first switch' ).toMatch(
			/^\?page=jetpack-forms-responses-wp-admin/
		);
		const urls = [ ...new Set( frames.map( f => f.href ) ) ];
		const stray = urls.filter( href => {
			const slug = new URLSearchParams( href.split( '#' )[ 0 ] ).get( 'page' );
			const own = MEMBERS.find( m => m.slug === slug );
			return own && ! OWN_ROUTES[ own.slug ].test( href );
		} );
		expect( stray, 'URLs written with another app’s route' ).toEqual( [] );
	} );

	test( 'a hidden app’s portals hide with it', async ( { page } ) => {
		await openMember( page, 'my-jetpack' );
		await switchTo( page, FORMS );
		await page.getByRole( 'button', { name: 'Create a form' } ).filter( { visible: true } ).click();
		const dialog = page.getByRole( 'dialog' );
		await expect( dialog ).toBeVisible();

		// The modal covers the sidebar, so leave through Back.
		await page.goBack();
		await waitForShown( page, 'my-jetpack' );
		await expect( dialog ).toBeHidden();
	} );
} );
