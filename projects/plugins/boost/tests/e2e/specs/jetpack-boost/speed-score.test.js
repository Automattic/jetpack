/**
 * External dependencies
 */
import { prerequisitesBuilder } from 'jetpack-e2e-tests/lib/env/prerequisites';
/**
 * Internal dependencies
 */
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage';

// TODO: This is for illustrative purpose only. It will need refactoring and improving.
describe( 'Speed Score feature', () => {
	beforeAll( async () => {
		await prerequisitesBuilder().withLoggedIn( true ).withConnection( true ).build();
	} );

	beforeEach( async function () {
		await JetpackBoostPage.visit( page );
	} );

	it( 'should display a score', async () => {
		const mobileSpeedBar = await page.$( 'div.jb-score-bar--mobile  .jb-score-bar__filler' );
		await page.waitForSelector( '.jb-score-bar__score', {
			state: 'visible',
		} );
		const mobileSpeedScore = await mobileSpeedBar.textContent( 'div.jb-score-bar__score' );
		// await page.pause();
		await expect( Number( mobileSpeedScore ) ).toBeGreaterThan( 0 );

		const desktopSpeedBar = await page.$( 'div.jb-score-bar--desktop  .jb-score-bar__filler' );
		const desktopSpeedScore = await desktopSpeedBar.textContent( 'div.jb-score-bar__score' );
		await expect( Number( desktopSpeedScore ) ).toBeGreaterThan( 0 );
	} );
} );
