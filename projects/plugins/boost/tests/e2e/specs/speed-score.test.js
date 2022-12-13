import { test, expect } from 'jetpack-e2e-commons/fixtures/base-test.js';
import logger from 'jetpack-e2e-commons/logger.cjs';
import { boostPrerequisitesBuilder } from '../lib/env/prerequisites.js';
import { JetpackBoostPage } from '../lib/pages/index.js';

let jetpackBoostPage;

test.describe( 'Speed Score feature', () => {
	test.beforeAll( async ( { browser } ) => {
		const page = await browser.newPage();
		await boostPrerequisitesBuilder( page )
			.withSpeedScoreMocked( false )
			.withGotStarted( true )
			.build();
	} );

	test.afterAll( async ( { browser } ) => {
		const page = await browser.newPage();
		await boostPrerequisitesBuilder( page )
			.withSpeedScoreMocked( true )
			.withGotStarted( true )
			.build();
	} );

	test.beforeEach( async function ( { page } ) {
		logger.action( 'XXXXX - APPLYING HOOKS - ' + page.url() );
		page.on( 'console', message => {
			logger.action( 'XXXXX CONSOLE - ' + message.text() );
		} );

		page.on( 'pageerror', error => {
			logger.action( 'XXXXX ERROR - ' + error.message );
		} );

		page.on( 'requestfailed', request => {
			logger.action( 'XXXXX REQUEST FAILED - ' + request.url() );
		} );

		jetpackBoostPage = await JetpackBoostPage.visit( page );

		logger.action( 'XXXXX - Hooks applied, page visited' );
	} );

	test( 'The Speed Score section should display a mobile and desktop speed score greater than zero', async () => {
		logger.action( 'XXXXX - starting the test.' );
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
