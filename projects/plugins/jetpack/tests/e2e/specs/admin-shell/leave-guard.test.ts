import { test, expect, type Page } from '@playwright/test';
import {
	installShellProbe,
	menuLink,
	openMember,
	readShell,
	switchTo,
	withinDocument,
} from '../../helpers/admin-shell-helper';

const NEWSLETTER = 'jetpack-newsletter';
const EDIT = 'Admin shell leave guard';

/**
 * Open Newsletter's Settings tab and leave an unsaved edit in it.
 *
 * @param page - Page under test.
 * @return The edited field.
 */
async function editNewsletterSettings( page: Page ) {
	await openMember( page, 'my-jetpack' );
	test.skip( ! ( await menuLink( page, NEWSLETTER ).count() ), 'Newsletter is not on this site' );
	await switchTo( page, NEWSLETTER );
	await page.getByRole( 'tab', { name: 'Settings' } ).filter( { visible: true } ).click();
	const sender = page.getByRole( 'textbox', { name: 'Sender name' } ).filter( { visible: true } );
	await sender.fill( EDIT );
	return sender;
}

/**
 * Answer every native dialog with `answer.accept`, and record its type.
 *
 * @param page - Page under test.
 * @return The recorded dialog types, and the answer to give the next ones.
 */
function answerDialogs( page: Page ) {
	const state = { seen: [] as string[], accept: true };
	page.on( 'dialog', dialog => {
		state.seen.push( dialog.type() );
		return state.accept ? dialog.accept() : dialog.dismiss();
	} );
	return state;
}

test.describe( 'Admin shell: unsaved changes', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	test( 'a menu click away from unsaved Newsletter Settings asks, and the edit survives', async ( {
		page,
	} ) => {
		const dialogs = answerDialogs( page );
		const sender = await editNewsletterSettings( page );

		await switchTo( page, 'my-jetpack' );
		expect( dialogs.seen ).toEqual( [ 'confirm' ] );
		await switchTo( page, NEWSLETTER );
		await expect( sender ).toHaveValue( EDIT );
	} );

	test( 'a link to another Newsletter tab asks before dropping unsaved Settings', async ( {
		page,
	} ) => {
		const dialogs = answerDialogs( page );
		const sender = await editNewsletterSettings( page );
		await switchTo( page, 'my-jetpack' );
		dialogs.seen.length = 0;
		dialogs.accept = false;

		// No Jetpack link targets another Newsletter tab yet; a future one would take this path.
		await page.evaluate( slug => {
			const a = document.createElement( 'a' );
			a.id = 'leave-guard-link';
			a.textContent = 'Newsletter subscribers';
			a.href = `admin.php?page=${ slug }&p=${ encodeURIComponent( '/?tab=subscribers' ) }`;
			// Above the app's fixed header, so the click is a real one.
			a.style.cssText = 'position: fixed; bottom: 0; right: 0; z-index: 100000';
			document.getElementById( 'wpbody-content' )!.append( a );
		}, NEWSLETTER );
		await withinDocument( page, 'the declined link', async () => {
			await page.locator( '#leave-guard-link' ).click();
			await expect.poll( () => dialogs.seen ).toEqual( [ 'confirm' ] );
		} );
		expect( ( await readShell( page ) ).visible ).toBe( 'my-jetpack' );

		dialogs.accept = true;
		await switchTo( page, NEWSLETTER );
		await expect( sender ).toHaveValue( EDIT );
	} );
} );
