import { test, expect, type Page } from '@playwright/test';
import {
	MEMBERS,
	VIEW_EVENT,
	installShellProbe,
	openMember,
	settle,
	skipUnlessOnSite,
	switchTo,
	tracksEvents,
} from '../../helpers/admin-shell-helper';

const FORMS = 'jetpack-forms-responses-wp-admin';

/* The other members may record no views on the unconnected test site, which would pass vacuously. */
const TRACKED = MEMBERS.filter( m => [ 'my-jetpack', FORMS ].includes( m.slug ) );

/* Tracks calls go out after render: the longest to wait for one, and the quiet spell that ends a wait. */
const SETTLE = 5000;
const QUIET = 1000;

/**
 * View events recorded since `from` events had been seen.
 *
 * @param page - Page under test.
 * @param from - Count of events already seen.
 * @return New view event names.
 */
async function viewsSince( page: Page, from: number ): Promise< string[] > {
	return ( await tracksEvents( page ) ).slice( from ).filter( name => VIEW_EVENT.test( name ) );
}

/**
 * Wait until `done` holds for the view events since `from` and no event has arrived for `QUIET`, or `SETTLE` passes.
 *
 * @param page - Page under test.
 * @param from - Count of events already seen.
 * @param done - Whether the views recorded so far are what the caller waits for.
 * @return New view event names.
 */
async function waitForViews(
	page: Page,
	from: number,
	done: ( views: string[] ) => boolean = () => true
): Promise< string[] > {
	const deadline = Date.now() + SETTLE;
	let count = -1;
	let lastArrival = Date.now();
	for (;;) {
		const events = await tracksEvents( page );
		if ( events.length !== count ) {
			count = events.length;
			lastArrival = Date.now();
		}
		const views = events.slice( from ).filter( name => VIEW_EVENT.test( name ) );
		if ( ( done( views ) && Date.now() - lastArrival >= QUIET ) || Date.now() >= deadline ) {
			return views;
		}
		await settle( page, 250 );
	}
}

const any = ( views: string[] ) => views.length > 0;

/**
 * View events a full load of `slug` records, skipping the test when there are none.
 *
 * @param page - Page under test.
 * @param slug - Member page slug.
 * @return Distinct view event names.
 */
async function fullLoadViews( page: Page, slug: string ): Promise< string[] > {
	await openMember( page, slug );
	const views = [ ...new Set( await waitForViews( page, 0, any ) ) ];
	test.skip( ! views.length, `${ slug } records no page view on a full load either` );
	return views;
}

/**
 * Let earlier Tracks calls land, switch to `slug`, and return the view events recorded on arrival.
 *
 * @param page     - Page under test.
 * @param slug     - Member page slug.
 * @param expected - View events to wait for.
 * @return New view event names.
 */
async function viewsOnSwitch( page: Page, slug: string, expected: string[] ): Promise< string[] > {
	await waitForViews( page, 0 );
	const seen = ( await tracksEvents( page ) ).length;
	await switchTo( page, slug );
	return waitForViews( page, seen, views => expected.every( name => views.includes( name ) ) );
}

test.describe( 'Admin shell: Tracks page views', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	for ( const m of TRACKED ) {
		const other = TRACKED.find( x => x !== m )!.slug;

		test( `the first switch to ${ m.slug } records the page view a full load does`, async ( {
			page,
		} ) => {
			await skipUnlessOnSite( page, m.slug );
			const expected = await fullLoadViews( page, m.slug );
			await openMember( page, other );
			expect( await viewsOnSwitch( page, m.slug, expected ) ).toEqual(
				expect.arrayContaining( expected )
			);
		} );

		test( `a return switch to ${ m.slug } records the page view again`, async ( { page } ) => {
			await skipUnlessOnSite( page, m.slug );
			const expected = await fullLoadViews( page, m.slug );
			await openMember( page, other );
			await switchTo( page, m.slug );
			await switchTo( page, other );
			const views = await viewsOnSwitch( page, m.slug, expected );
			// Called here, so a failed switch above is still a real failure.
			test.fail( true, 'Known gap: a kept-alive app records no page view when shown again.' );
			expect( views ).toEqual( expect.arrayContaining( expected ) );
		} );
	}

	test( 'hidden apps record no page views while another is shown', async ( { page } ) => {
		await openMember( page, FORMS );
		const formsViews = new Set( await waitForViews( page, 0, any ) );
		await openMember( page, 'my-jetpack' );
		const own = new Set( await waitForViews( page, 0, any ) );
		expect( own.size, 'the probe sees My Jetpack’s own page view' ).toBeGreaterThan( 0 );
		test.skip(
			[ ...formsViews ].every( name => own.has( name ) ),
			'Forms records no view event of its own, so a leak would not show'
		);

		// Forms' router stays mounted while hidden; My Jetpack's URL writes must not reach it.
		await switchTo( page, FORMS );
		await switchTo( page, 'my-jetpack' );
		await waitForViews( page, 0 );
		const seen = ( await tracksEvents( page ) ).length;
		await page.getByRole( 'tab', { name: 'Features' } ).filter( { visible: true } ).click();
		await settle( page, SETTLE );
		const foreign = ( await viewsSince( page, seen ) ).filter(
			name => formsViews.has( name ) && ! own.has( name )
		);
		expect( foreign, 'view events from apps that are not shown' ).toEqual( [] );
	} );
} );
