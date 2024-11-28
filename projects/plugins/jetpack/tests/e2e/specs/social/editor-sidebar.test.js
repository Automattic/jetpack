import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/index.js';
import { expect, test } from 'jetpack-e2e-commons/fixtures/base-test.js';
import logger from 'jetpack-e2e-commons/logger.js';
import { BlockEditorPage } from 'jetpack-e2e-commons/pages/wp-admin/index.js';

test.beforeEach( async ( { page } ) => {
	await prerequisitesBuilder( page )
		.withCleanEnv()
		.withLoggedIn( true )
		.withWpComLoggedIn( true )
		.withConnection( true )
		.build();
} );

test.describe( 'Editor sidebar: Social', () => {
	test( 'Activation of publicize from the editor', async ( { page } ) => {
		logger.sync( 'Creating new post' );

		/**
		 * @type {BlockEditorPage}
		 */
		const blockEditor = await BlockEditorPage.visit( page );

		await page.waitForURL( '**/post-new.php' );
		await blockEditor.waitForEditor();

		logger.action( 'Close "Welcome to the block editor" dialog' );
		await blockEditor.closeWelcomeGuide();

		logger.action( 'Open Jetpack sidebar' );
		await blockEditor.openSettings( 'Jetpack' );

		const settingsSidebar = blockEditor.getEditorSettingsSidebar();

		const socialPanel = settingsSidebar.getByRole( 'button', {
			name: 'Share this post',
		} );

		logger.action( 'Expand "Share this post" panel' );
		await socialPanel.click();

		const activateSocialButton = settingsSidebar.getByRole( 'button', {
			name: 'Activate Jetpack Social',
		} );

		logger.action( 'Activate Jetpack Social' );
		await Promise.all( [
			activateSocialButton.click(),
			page.waitForRequest( request => {
				// We need to consider both pretty and ugly permalink structures
				const route = 'jetpack/v4/module/publicize/active';

				return (
					request.url().includes( route ) ||
					new URL( request.url() ).searchParams.get( 'rest_route' ).includes( route )
				);
			} ),
		] );

		logger.action( 'Verify that the social panel is still there' );
		await expect( socialPanel ).toBeVisible();

		const element = blockEditor.getEditorSettingsSidebar().getByLabel( 'Share when publishing' );

		await element.waitFor();

		// Should be unchecked by default because there are no connections
		await expect( element ).not.toBeChecked();
	} );
} );
