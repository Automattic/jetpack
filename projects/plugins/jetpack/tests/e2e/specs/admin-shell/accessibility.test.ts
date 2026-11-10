import { test, expect, type Page } from '@playwright/test';
import {
	announcements,
	axeViolations,
	focusOwner,
	hiddenApps,
	installA11yProbe,
	keyboardSwitchTo,
	mainHeading,
	newViolations,
	placeholderSightings,
	resetA11yProbe,
} from '../../helpers/admin-shell-a11y-helper';
import {
	installShellProbe,
	member,
	openMember,
	settle,
	switchTo,
	waitForShown,
	withinDocument,
} from '../../helpers/admin-shell-helper';

/* JETPACK-3401. My Jetpack and Forms are the first pair every client version registers. */
const MJ = 'my-jetpack';
const FORMS = 'jetpack-forms-responses-wp-admin';

const NO_FOCUS = 'Not implemented: a switch leaves focus where it was instead of on the heading.';

const back = ( page: Page, slug: string ) =>
	withinDocument( page, `Back to ${ slug }`, async () => {
		await page.goBack();
		await waitForShown( page, slug );
	} );

const createForm = ( page: Page ) =>
	page.getByRole( 'button', { name: 'Create a form' } ).filter( { visible: true } );

test.describe( 'Admin shell: accessibility of in-shell navigation', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
		await installA11yProbe( page );
	} );

	test( 'focus moves to the shown page’s heading on every switch', async ( { page } ) => {
		test.fail( true, NO_FOCUS );
		await openMember( page, MJ );
		await switchTo( page, FORMS );
		await expect( mainHeading( page, FORMS ) ).toBeFocused();
		await switchTo( page, MJ );
		await expect( mainHeading( page, MJ ) ).toBeFocused();
		await back( page, FORMS );
		await expect( mainHeading( page, FORMS ) ).toBeFocused();
	} );

	test( 'every switch announces the new page title politely', async ( { page } ) => {
		test.fail( true, 'Not implemented: no live region announces a switch.' );
		await openMember( page, MJ );
		for ( const slug of [ FORMS, MJ ] ) {
			await resetA11yProbe( page );
			await switchTo( page, slug );
			await expect
				.poll( () => announcements( page ), `announcement for ${ slug }` )
				.toContainEqual(
					expect.objectContaining( {
						politeness: 'polite',
						text: expect.stringContaining( member( slug ).title ),
					} )
				);
		}
	} );

	test( 'hidden apps are inert and out of the accessibility tree', async ( { page } ) => {
		await openMember( page, MJ );
		for ( const [ shown, hidden ] of [
			[ FORMS, MJ ],
			[ MJ, FORMS ],
		] ) {
			await switchTo( page, shown );
			expect( await hiddenApps( page ), `apps hidden behind ${ shown }` ).toEqual( [
				{ slug: hidden, state: 'hidden', inert: true },
			] );
			await expect( mainHeading( page, hidden ) ).toHaveCount( 0 );
			await expect( mainHeading( page, shown ) ).toHaveCount( 1 );
		}
	} );

	test( 'the header placeholder is inert and hidden from screen readers', async ( { page } ) => {
		await openMember( page, MJ );
		await resetA11yProbe( page );
		await switchTo( page, FORMS );
		const sightings = await placeholderSightings( page );
		expect( sightings.length, 'a placeholder showed during the first switch' ).toBeGreaterThan( 0 );
		expect( sightings ).toEqual( sightings.map( () => ( { inert: true, ariaHidden: true } ) ) );
	} );

	test( 'a switch adds no serious or critical axe violations', async ( { page } ) => {
		const baseline: Record< string, Record< string, string[] > > = {};
		for ( const slug of [ FORMS, MJ ] ) {
			await openMember( page, slug );
			// Widgets such as My Jetpack's stats cards render well after the heading.
			await settle( page, 8000 );
			baseline[ slug ] = await axeViolations( page );
			test.info().annotations.push( {
				type: 'axe on full load',
				description: `${ slug }: ${ Object.keys( baseline[ slug ] ).join( ', ' ) || 'none' }`,
			} );
		}
		await switchTo( page, FORMS );
		await settle( page, 8000 );
		expect(
			await newViolations( page, baseline[ FORMS ] ),
			'new after switching to Forms'
		).toEqual( {} );
		await switchTo( page, MJ );
		await settle( page, 8000 );
		expect( await newViolations( page, baseline[ MJ ] ), 'new after switching back' ).toEqual( {} );
	} );

	test( 'a switched-in app’s modal takes focus and returns it on Escape', async ( { page } ) => {
		await openMember( page, MJ );
		await keyboardSwitchTo( page, FORMS );
		await createForm( page ).focus();
		await page.keyboard.press( 'Enter' );
		const dialog = page.getByRole( 'dialog' );
		await expect( dialog ).toBeVisible();
		const focusInDialog = () =>
			expect
				.poll( () => dialog.evaluate( d => d.contains( d.ownerDocument.activeElement ) ) )
				.toBe( true );
		await focusInDialog();
		for ( let i = 0; i < 4; i++ ) {
			await page.keyboard.press( 'Tab' );
			await focusInDialog();
		}
		await page.keyboard.press( 'Escape' );
		await expect( dialog ).toBeHidden();
		await expect( createForm( page ) ).toBeFocused();
	} );

	test( 'keyboard: sidebar, page, modal, Back', async ( { page } ) => {
		test.fail( true, NO_FOCUS );
		await openMember( page, MJ );
		await keyboardSwitchTo( page, FORMS );
		await expect( mainHeading( page, FORMS ) ).toBeFocused();
		await page.keyboard.press( 'Tab' );
		expect( await focusOwner( page ), 'Tab after a switch stays in the page' ).toBe( FORMS );

		await createForm( page ).focus();
		await page.keyboard.press( 'Enter' );
		const dialog = page.getByRole( 'dialog' );
		await expect( dialog ).toBeVisible();
		await back( page, MJ );
		await expect( dialog ).toBeHidden();
		await expect( mainHeading( page, MJ ) ).toBeFocused();
	} );
} );
