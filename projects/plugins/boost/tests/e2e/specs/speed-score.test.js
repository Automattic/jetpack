import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import { boostPrerequisitesBuilder } from '../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../lib/pages/index.js';
import logger from 'jetpack-e2e-commons/logger.cjs';

let jetpackBoostPage;

test.describe( 'Speed Score feature', () => {
	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage();

		if ( ! page.hasHooks ) {
			logger.action( 'SETTING UP HOOKS' );
			page
				.on( 'console', message =>
					logger.action(
						`CONSOLE: ${ message.type().substr( 0, 3 ).toUpperCase() } ${ message.text() }`
					)
				)
				.on( 'pageerror', ( { message } ) => logger.info( 'ERROR: ' + message ) )
				.on( 'requestfailed', request =>
					logger.action( `RQ FAILED ${ request.failure().errorText } ${ request.url() }` )
				);
			page.hasHooks = true;
		}

		await boostPrerequisitesBuilder( page ).withSpeedScoreMocked( false ).withGotStarted().build();
	} );

	test.afterAll( async ( { browser } ) => {
		const page = await browser.newPage();
		await boostPrerequisitesBuilder( page ).withSpeedScoreMocked( true ).build();
	} );

	test.beforeEach( async function ( { page } ) {
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	test( 'The Speed Score section should display a mobile and desktop speed score greater than zero', async () => {
		expect(
			await jetpackBoostPage.getSpeedScore( 'mobile' ),
			'Mobile speed score should be greater than 0'
		).toBeGreaterThan( 0 );
		expect(
			await jetpackBoostPage.getSpeedScore( 'desktop' ),
			'Desktop speed score should be greater than 0'
		).toBeGreaterThan( 0 );
	} );

	test( 'The Speed Scores should be able to refresh', async () => {
		await jetpackBoostPage.waitForScoreLoadingToFinish();
		await jetpackBoostPage.clickRefreshSpeedScore();

		expect( await jetpackBoostPage.isScoreLoading(), 'Score should be loading' ).toBeTruthy();
		await jetpackBoostPage.waitForScoreLoadingToFinish();
		expect( await jetpackBoostPage.isScoreVisible(), 'Score should be displayed' ).toBeTruthy();
	} );

	test( 'Should be able to hover info icon next to overall score and see the detailed overall score description popin', async () => {
		await jetpackBoostPage.waitForScoreLoadingToFinish();
		await jetpackBoostPage.page.hover( '.jb-score-context' );
		expect(
			await jetpackBoostPage.isScoreDescriptionPopinVisible(),
			'Score description should be visible'
		).toBeTruthy();
	} );
} );
