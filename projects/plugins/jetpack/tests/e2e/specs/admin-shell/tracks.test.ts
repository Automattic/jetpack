import { test, expect, type Page } from '@playwright/test';
import {
	MEMBERS,
	VIEW_EVENT,
	installShellProbe,
	openMember,
	settle,
	switchTo,
	tracksEvents,
} from '../../helpers/admin-shell-helper';

/* Tracks calls go out after render, so give each arrival a moment before reading. */
const SETTLE = 5000;

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
 * View events a full load of `slug` records, skipping the test when there are none.
 *
 * @param page - Page under test.
 * @param slug - Member page slug.
 * @return Distinct view event names.
 */
async function fullLoadViews( page: Page, slug: string ): Promise< string[] > {
	await openMember( page, slug );
	await settle( page, SETTLE );
	const views = [ ...new Set( await viewsSince( page, 0 ) ) ];
	test.skip( ! views.length, `${ slug } records no page view on a full load either` );
	return views;
}

/**
 * Switch to `slug` and return the view events recorded on arrival.
 *
 * @param page - Page under test.
 * @param slug - Member page slug.
 * @return New view event names.
 */
async function viewsOnSwitch( page: Page, slug: string ): Promise< string[] > {
	const seen = ( await tracksEvents( page ) ).length;
	await switchTo( page, slug );
	await settle( page, SETTLE );
	return viewsSince( page, seen );
}

test.describe( 'Admin shell: Tracks page views', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	for ( const m of MEMBERS ) {
		const other = m.slug === 'jetpack-podcast' ? 'jetpack-newsletter' : 'jetpack-podcast';

		test( `the first switch to ${ m.slug } records the page view a full load does`, async ( {
			page,
		} ) => {
			const expected = await fullLoadViews( page, m.slug );
			await openMember( page, other );
			expect( await viewsOnSwitch( page, m.slug ) ).toEqual( expect.arrayContaining( expected ) );
		} );

		test( `a return switch to ${ m.slug } records the page view again`, async ( { page } ) => {
			const expected = await fullLoadViews( page, m.slug );
			test.fail( true, 'Spike bug: a kept-alive app records no page view when shown again.' );
			await openMember( page, other );
			await switchTo( page, m.slug );
			await switchTo( page, other );
			expect( await viewsOnSwitch( page, m.slug ) ).toEqual( expect.arrayContaining( expected ) );
		} );
	}

	test( 'hidden apps record no page views while another is shown', async ( { page } ) => {
		await openMember( page, 'my-jetpack' );
		await settle( page, SETTLE );
		const own = new Set( await viewsSince( page, 0 ) );
		expect( own.size, 'the probe sees My Jetpack’s own page view' ).toBeGreaterThan( 0 );

		// Settings' router stays mounted while hidden; My Jetpack's hash writes reach it.
		await openMember( page, 'jetpack-settings' );
		await settle( page, SETTLE );
		const settingsViews = ( await viewsSince( page, 0 ) ).filter( name => ! own.has( name ) );
		expect(
			settingsViews,
			'Settings records a view My Jetpack does not, so a leak would show'
		).not.toEqual( [] );
		await switchTo( page, 'my-jetpack' );
		await switchTo( page, 'jetpack-podcast' );
		await settle( page, SETTLE );
		const seen = ( await tracksEvents( page ) ).length;
		await switchTo( page, 'my-jetpack' );
		await settle( page, SETTLE );
		const foreign = ( await viewsSince( page, seen ) ).filter( name => ! own.has( name ) );
		expect( foreign, 'view events from apps that are not shown' ).toEqual( [] );
	} );
} );
