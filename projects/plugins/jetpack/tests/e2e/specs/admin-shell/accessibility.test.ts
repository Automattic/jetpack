import { test, expect, type Page } from '@playwright/test';
import {
	announcements,
	ariaHiddenAncestors,
	axeViolations,
	focusOwner,
	hasSavedHeader,
	hiddenApps,
	installA11yProbe,
	keyboardSwitchTo,
	mainHeading,
	newViolations,
	placeholderSightings,
	resetA11yProbe,
} from '../../helpers/admin-shell-a11y-helper';
import {
	intermittentSpikeBug,
	installShellProbe,
	isShellActive,
	member,
	openMember,
	readShell,
	settle,
	switchTo,
	waitForShown,
	withinDocument,
} from '../../helpers/admin-shell-helper';

/* JETPACK-3401. My Jetpack and Forms are the first pair every client version registers. */
const MJ = 'my-jetpack';
const FORMS = 'jetpack-forms-responses-wp-admin';

// Widgets such as My Jetpack's stats cards render well after the heading.
const AXE_SETTLE_MS = 8000;

const back = ( page: Page, slug: string ) =>
	withinDocument( page, `Back to ${ slug }`, async () => {
		await page.goBack();
		await waitForShown( page, slug );
	} );

const createForm = ( page: Page ) =>
	page.getByRole( 'button', { name: 'Create a form' } ).filter( { visible: true } );

const openCreateForm = async ( page: Page ) => {
	await createForm( page ).focus();
	await page.keyboard.press( 'Enter' );
	const dialog = page.getByRole( 'dialog' );
	await expect( dialog ).toBeVisible();
	return dialog;
};

/**
 * Check a step landed in the shell: `slug` on screen, `other` hidden.
 *
 * @param page  - Page under test.
 * @param slug  - Member that should be shown.
 * @param other - Member that should be hidden.
 */
async function expectSwitched( page: Page, slug: string, other: string ): Promise< void > {
	expect( await isShellActive( page ), `the shell still runs after showing ${ slug }` ).toBe(
		true
	);
	const { apps } = await readShell( page );
	expect( [ apps[ slug ], apps[ other ] ], `${ slug } shown, ${ other } hidden` ).toEqual( [
		'visible',
		'hidden',
	] );
	// On screen, whatever the accessibility tree says: the tests themselves check that.
	await expect(
		page
			.getByRole( 'heading', {
				level: 1,
				name: member( slug ).heading,
				exact: true,
				includeHidden: true,
			} )
			.filter( { visible: true } )
	).toBeVisible();
}

type Go = ( page: Page, slug: string ) => Promise< void >;

/* Each step shows the first slug and leaves the second hidden. */
const ROUND_TRIP: [ string, string, Go ][] = [
	[ FORMS, MJ, switchTo ],
	[ MJ, FORMS, switchTo ],
	[ FORMS, MJ, back ],
];
const STEP_NAMES = [ 'switching to Forms', 'switching back to My Jetpack', 'going Back to Forms' ];

/**
 * Walk the round trip up to step `i` and run `check` only after that step.
 *
 * @param page  - Page under test.
 * @param i     - Index into `ROUND_TRIP`.
 * @param check - Assertion for the last step.
 * @param reset - Runs before the last step.
 */
async function walkTo( page: Page, i: number, check: Go, reset?: Go ): Promise< void > {
	let step = 0;
	await walk( page, ROUND_TRIP.slice( 0, i + 1 ), {
		before: ( p, slug ) => ( step === i && reset ? reset( p, slug ) : Promise.resolve() ),
		after: ( p, slug ) => ( step++ === i ? check( p, slug ) : Promise.resolve() ),
	} );
}

/**
 * Open My Jetpack, then take `steps`, checking each landed in the shell before `after` runs.
 *
 * @param page         - Page under test.
 * @param steps        - Steps from `ROUND_TRIP`.
 * @param hooks        - Checks around each step.
 * @param hooks.before - Runs before the step.
 * @param hooks.after  - Runs once the step's setup holds.
 */
async function walk(
	page: Page,
	steps: [ string, string, Go ][],
	{ before, after }: { before?: Go; after?: Go } = {}
): Promise< void > {
	await openMember( page, MJ );
	for ( const [ slug, other, go ] of steps ) {
		await before?.( page, slug );
		await go( page, slug );
		await expectSwitched( page, slug, other );
		await after?.( page, slug );
	}
}

/**
 * Keyboard switch to Forms, open its modal, go Back to My Jetpack, checking the setup on the way.
 *
 * @param page              - Page under test.
 * @param hooks             - Checks at each stop.
 * @param hooks.afterSwitch - Runs once Forms is shown.
 * @param hooks.afterBack   - Runs once My Jetpack is shown again and the modal is gone.
 */
async function keyboardPass(
	page: Page,
	{
		afterSwitch,
		afterBack,
	}: { afterSwitch?: () => Promise< void >; afterBack?: () => Promise< void > } = {}
): Promise< void > {
	await openMember( page, MJ );
	await keyboardSwitchTo( page, FORMS );
	await expectSwitched( page, FORMS, MJ );
	await afterSwitch?.();
	const dialog = await openCreateForm( page );
	await back( page, MJ );
	await expectSwitched( page, MJ, FORMS );
	await expect( dialog ).toBeHidden();
	await afterBack?.();
}

test.describe( 'Admin shell: accessibility of in-shell navigation', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
		await installA11yProbe( page );
	} );

	// One test per step, so a failure names the step that lost focus.
	STEP_NAMES.forEach( ( name, i ) => {
		test( `focus moves to the shown page’s heading after ${ name }`, async ( { page } ) => {
			await walkTo( page, i, ( p, slug ) => expect( mainHeading( p, slug ) ).toBeFocused() );
		} );
	} );

	test( 'setup: the announcement probe hears a polite live region', async ( { page } ) => {
		await openMember( page, MJ );
		await resetA11yProbe( page );
		await page.evaluate( () => {
			const region = document.createElement( 'div' );
			region.setAttribute( 'aria-live', 'polite' );
			document.body.append( region );
			setTimeout( () => ( region.textContent = 'Probe check' ), 50 );
		} );
		await expect
			.poll( () => announcements( page ) )
			.toContainEqual( { politeness: 'polite', text: 'Probe check' } );
	} );

	STEP_NAMES.slice( 0, 2 ).forEach( ( name, i ) => {
		test( `the new page title is announced politely after ${ name }`, async ( { page } ) => {
			await walkTo(
				page,
				i,
				( p, slug ) =>
					expect
						.poll( () => announcements( p ), `announcement for ${ slug }` )
						.toContainEqual(
							expect.objectContaining( {
								politeness: 'polite',
								text: expect.stringContaining( member( slug ).title ),
							} )
						),
				resetA11yProbe
			);
		} );
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
		// A fresh browser has no saved headers, so load Forms once to get a stand-in for it.
		await openMember( page, FORMS );
		await expect.poll( () => hasSavedHeader( page, FORMS ), 'Forms header saved' ).toBe( true );
		await openMember( page, MJ );
		await resetA11yProbe( page );
		await switchTo( page, FORMS );
		await expect
			.poll( async () => ( await placeholderSightings( page ) ).length, 'a placeholder showed' )
			.toBeGreaterThan( 0 );
		const sightings = await placeholderSightings( page );
		expect( sightings ).toEqual( sightings.map( () => ( { inert: true, ariaHidden: true } ) ) );
	} );

	test( 'a switch adds no serious or critical axe violations', async ( { page } ) => {
		const baseline: Record< string, Record< string, string[] > > = {};
		for ( const slug of [ FORMS, MJ ] ) {
			await openMember( page, slug );
			await settle( page, AXE_SETTLE_MS );
			baseline[ slug ] = await axeViolations( page );
			test.info().annotations.push( {
				type: 'axe on full load',
				description: `${ slug }: ${ Object.keys( baseline[ slug ] ).join( ', ' ) || 'none' }`,
			} );
		}
		await switchTo( page, FORMS );
		await settle( page, AXE_SETTLE_MS );
		expect(
			await newViolations( page, baseline[ FORMS ] ),
			'new after switching to Forms'
		).toEqual( {} );
		await switchTo( page, MJ );
		await settle( page, AXE_SETTLE_MS );
		expect( await newViolations( page, baseline[ MJ ] ), 'new after switching back' ).toEqual( {} );
	} );

	test( 'a switched-in app’s modal takes focus and returns it on Escape', async ( { page } ) => {
		await openMember( page, MJ );
		await keyboardSwitchTo( page, FORMS );
		const dialog = await openCreateForm( page );
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

	test( 'keyboard: a switch from the sidebar focuses the page', async ( { page } ) => {
		await keyboardPass( page, {
			afterSwitch: async () => {
				await expect( mainHeading( page, FORMS ) ).toBeFocused();
				await page.keyboard.press( 'Tab' );
				expect( await focusOwner( page ), 'Tab after a switch stays in the page' ).toBe( FORMS );
			},
		} );
	} );

	intermittentSpikeBug(
		'Firefox and WebKit sometimes hear no announcement of My Jetpack after Back closes the Forms modal',
		() => {
			test( 'going Back with a modal open leaves the shown page in the accessibility tree', async ( {
				page,
			} ) => {
				await keyboardPass( page, {
					afterBack: async () => {
						// The modal gives the document back once its closing animation ends.
						await expect
							.poll( () => ariaHiddenAncestors( page, MJ ), 'aria-hidden around the shown app' )
							.toEqual( [] );
						// The probe skips live regions that are aria-hidden when they change.
						await expect
							.poll( () => announcements( page ), 'announcement for the page Back showed' )
							.toContainEqual(
								expect.objectContaining( { text: expect.stringContaining( member( MJ ).title ) } )
							);
						await expect( mainHeading( page, MJ ) ).toBeFocused();
						await expect( mainHeading( page, MJ ) ).toBeVisible();
					},
				} );
			} );
		}
	);
} );
