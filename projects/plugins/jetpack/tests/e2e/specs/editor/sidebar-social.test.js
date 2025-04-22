import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/index.js';
import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.js';
import logger from '_jetpack-e2e-commons/logger.js';
import { BlockEditorPage } from '_jetpack-e2e-commons/pages/wp-admin/index.js';

test.beforeEach( async ( { page } ) => {
	await prerequisitesBuilder( page )
		.withCleanEnv()
		.withLoggedIn( true )
		.withWpComLoggedIn( true )
		.withConnection( true )
		.build();
} );

test.describe( 'Editor sidebar: Social', () => {
	test( 'Activation of publicize from the editor', async ( { admin, page } ) => {
		logger.sync( 'Creating new post' );

		/**
		 * @type {BlockEditorPage}
		 */
		const blockEditor = await BlockEditorPage.visit( page );

		await admin.createNewPost( { title: 'Testing Social Sidebar' } );

		logger.action( 'Open Jetpack sidebar' );
		await blockEditor.openSettings( 'Jetpack' );

		const settingsSidebar = blockEditor.getEditorSettingsSidebar();

		const socialPanel = settingsSidebar.getByRole( 'button', {
			name: 'Share this post',
		} );

		logger.action( 'Expand "Share this post" panel' );
		await socialPanel.click();

		const activateSocialLink = settingsSidebar.getByRole( 'link', {
			name: 'Activate Jetpack Social',
		} );

		await expect( activateSocialLink ).toBeVisible();
	} );
} );
