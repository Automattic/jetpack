import { Plans, prerequisitesBuilder } from '_jetpack-e2e-commons/env/index.js';
import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.js';
import logger from '_jetpack-e2e-commons/logger.js';
import { BlockEditorPage } from '_jetpack-e2e-commons/pages/wp-admin/index.js';
import playwrightConfig from '../../playwright.config.mjs';

test.beforeEach( async ( { browser } ) => {
	const page = await browser.newPage( playwrightConfig.use );
	await prerequisitesBuilder( page )
		.withCleanEnv()
		.withLoggedIn( true )
		.withWpComLoggedIn( true )
		.withConnection( true )
		.withPlan( Plans.Free )
		.build();
	await page.close();
} );

test.describe( 'Forms: Submission', () => {
	test( 'Can submit a simple contact form', async ( { editor, page } ) => {
		logger.sync( 'Creating new post' );

		/**
		 * @type {BlockEditorPage}
		 */
		const blockEditor = await BlockEditorPage.visit( page );

		await page.waitForURL( '**/post-new.php' );
		await blockEditor.waitForEditor();

		logger.action( 'Close "Welcome to the block editor" dialog' );
		await blockEditor.closeWelcomeGuide();

		logger.action( 'Insert a contact form' );
		await editor.insertBlock( { name: 'jetpack/contact-form' } );

		const formBlock = editor.canvas.getByRole( 'document', { name: 'Block: Form' } );
		await expect( formBlock ).toBeVisible();
	} );
} );
