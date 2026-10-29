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

test.describe( 'Admin shell: Tracks page views', () => {
	test.beforeEach( async ( { page } ) => {
		await installShellProbe( page );
	} );

	for ( const m of MEMBERS ) {
		const other = m.slug === 'jetpack-podcast' ? 'jetpack-newsletter' : 'jetpack-podcast';

		test( `every switch to ${ m.slug } records the page view a full load does`, async ( {
			page,
		} ) => {
			await openMember( page, m.slug );
			await settle( page, SETTLE );
			const expected = [ ...new Set( await viewsSince( page, 0 ) ) ];
			test.skip( ! expected.length, `${ m.slug } records no page view on a full load either` );
			test.fail( true, 'Spike bug: a kept-alive app records no page view when shown again.' );

			await openMember( page, other );
			for ( const visit of [ 'first', 'return' ] ) {
				const seen = ( await tracksEvents( page ) ).length;
				await switchTo( page, m.slug );
				await settle( page, SETTLE );
				expect( await viewsSince( page, seen ), `${ visit } visit` ).toEqual(
					expect.arrayContaining( expected )
				);
				await switchTo( page, other );
			}
		} );
	}

	test( 'hidden apps record no page views while another is shown', async ( { page } ) => {
		await openMember( page, 'my-jetpack' );
		await settle( page, SETTLE );
		const own = new Set( await viewsSince( page, 0 ) );

		// Settings' router stays mounted while hidden; My Jetpack's hash writes reach it.
		await openMember( page, 'jetpack-settings' );
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
