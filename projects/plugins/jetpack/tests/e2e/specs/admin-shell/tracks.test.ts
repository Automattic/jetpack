import { test, expect, type Page } from '@playwright/test';
import {
	VIEW_EVENT,
	installShellProbe,
	openMember,
	settle,
	switchTo,
	tracksEvents,
} from '../../helpers/admin-shell-helper';

const FORMS = 'jetpack-forms-responses-wp-admin';

/* My Jetpack is the one member that records views on the unconnected test site; Forms is the other side. */
const MJ = 'my-jetpack';

/* Tracks calls go out after render: the longest to wait for one, and the quiet spell that ends a wait. */
const SETTLE = 5000;
const QUIET = 1000;

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

	test( 'the first switch to My Jetpack records the page view a full load does', async ( {
		page,
	} ) => {
		const expected = await fullLoadViews( page, MJ );
		await openMember( page, FORMS );
		expect( await viewsOnSwitch( page, MJ, expected ) ).toEqual(
			expect.arrayContaining( expected )
		);
	} );

	test( 'a return switch to My Jetpack records the page view again', async ( { page } ) => {
		const expected = await fullLoadViews( page, MJ );
		await openMember( page, FORMS );
		await switchTo( page, MJ );
		await switchTo( page, FORMS );
		expect( await viewsOnSwitch( page, MJ, expected ) ).toEqual(
			expect.arrayContaining( expected )
		);
	} );
} );
