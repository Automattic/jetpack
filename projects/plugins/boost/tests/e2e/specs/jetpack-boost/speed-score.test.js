/**
 * Internal dependencies
 */
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage';
import { prerequisitesBuilder } from '../../lib/env/prerequisites';

// TODO: This is for illustrative purpose only. It will need refactoring and improving.

describe( 'Speed Score feature', () => {
	const requestId = '37bc9e93b4102d00a4b30c8dff219a98';
	let jetpackBoostPage;

	beforeAll( async () => {
		await prerequisitesBuilder().withLoggedIn( true ).build();
	} );

	beforeEach( async function () {
		await page.route( '**/jetpack-boost/v1/speed-scores', route =>
			route.fulfill( {
				status: 200,
				contentType: 'application/json; charset=UTF-8',
				body: JSON.stringify( {
					id: requestId,
					url: siteUrl,
					created: 1629788594.313054,
					scores: null,
					error: null,
				} ),
			} )
		);
	} );

	afterEach( async function () {
		await JetpackBoostPage.close( page );
	} );

	it( 'should display a high score', async () => {
		await page.route( '**/jetpack-boost/v1/speed-scores/*/update', route =>
			route.fulfill( {
				status: 200,
				contentType: 'application/json; charset=UTF-8',
				body: JSON.stringify( {
					id: requestId,
					url: siteUrl,
					created: 1629788594.313054,
					scores: { mobile: 99, desktop: 100 },
					error: null,
				} ),
			} )
		);

		jetpackBoostPage = await JetpackBoostPage.visit( page );

		await jetpackBoostPage.waitForSiteScoreUpdateApiResponse();

		const mobileSpeedBar = await page.$( 'div.jb-score-bar--mobile  .jb-score-bar__filler' );
		await expect( mobileSpeedBar ).toHaveText( '.jb-score-bar__score', '99' );

		const desktopSpeedBar = await page.$( 'div.jb-score-bar--desktop  .jb-score-bar__filler' );
		await expect( desktopSpeedBar ).toHaveText( '.jb-score-bar__score', '100' );
	} );

	it( 'should display a medium score', async () => {
		await page.route( '**/jetpack-boost/v1/speed-scores/*/update', route =>
			route.fulfill( {
				status: 200,
				contentType: 'application/json; charset=UTF-8',
				body: JSON.stringify( {
					id: requestId,
					url: siteUrl,
					created: 1629788594.313054,
					scores: { mobile: 49, desktop: 50 },
					error: null,
				} ),
			} )
		);

		jetpackBoostPage = await JetpackBoostPage.visit( page );

		await jetpackBoostPage.waitForSiteScoreUpdateApiResponse();

		const mobileSpeedBar = await page.$( 'div.jb-score-bar--mobile  .jb-score-bar__filler' );
		await expect( mobileSpeedBar ).toHaveText( '.jb-score-bar__score', '49' );

		const desktopSpeedBar = await page.$( 'div.jb-score-bar--desktop  .jb-score-bar__filler' );
		await expect( desktopSpeedBar ).toHaveText( '.jb-score-bar__score', '50' );
	} );

	it( 'should display a low score', async () => {
		await page.route( '**/jetpack-boost/v1/speed-scores/*/update', route =>
			route.fulfill( {
				status: 200,
				contentType: 'application/json; charset=UTF-8',
				body: JSON.stringify( {
					id: requestId,
					url: siteUrl,
					created: 1629788594.313054,
					scores: { mobile: 9, desktop: 10 },
					error: null,
				} ),
			} )
		);

		jetpackBoostPage = await JetpackBoostPage.visit( page );

		await jetpackBoostPage.waitForSiteScoreUpdateApiResponse();

		const mobileSpeedBar = await page.$( 'div.jb-score-bar--mobile  .jb-score-bar__filler' );
		await expect( mobileSpeedBar ).toHaveText( '.jb-score-bar__score', '9' );

		const desktopSpeedBar = await page.$( 'div.jb-score-bar--desktop  .jb-score-bar__filler' );
		await expect( desktopSpeedBar ).toHaveText( '.jb-score-bar__score', '10' );
	} );
} );
