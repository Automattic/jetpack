import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/prerequisites.js';
import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import logger from '_jetpack-e2e-commons/logger.js';
import BlockEditorPage from '_jetpack-e2e-commons/pages/wp-admin/block-editor.js';
import { disconnect } from '_jetpack-e2e-commons/utils/connection-utils.ts';
import { connect } from '../flows/index.js';
import playwrightConfig from '../playwright.config.mjs';

test.beforeAll( async ( { browser, requestUtils, testUtils } ) => {
	await disconnect( requestUtils );
	await testUtils.executeWpCommand( 'option delete jetpack-social_show_pricing_page' );

	const page = await browser.newPage( playwrightConfig.use );
	await prerequisitesBuilder( page )
		.withInactivePlugins( [ 'jetpack' ] )
		.withActivePlugins( [ 'jetpack-social' ] )
		.build();
	await page.close();
} );

test( 'Jetpack Social sidebar', async ( { page, admin } ) => {
	await test.step( 'Connect wordpress.com account', async () => {
		await connect( page );
	} );

	const blockEditor = new BlockEditorPage( page );

	await test.step( 'Goto post edit page', async () => {
		logger.action( 'Create new post' );
		await admin.createNewPost( { title: 'Jetpack Social test post' } );
	} );

	await test.step( 'Check Social sidebar', async () => {
		logger.action( 'Open Jetpack Social sidebar' );
		await blockEditor.openSettings( 'Jetpack Social' );

		logger.action( 'Checking for "Preview" button' );
		const previewButton = blockEditor
			.getEditorSettingsSidebar()
			.getByRole( 'button', { name: 'Open Social Previews', exact: true } );
		await expect( previewButton ).toBeVisible();
	} );
} );
