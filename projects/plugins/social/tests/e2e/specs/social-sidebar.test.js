import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites.js';
import { expect, test } from 'jetpack-e2e-commons/fixtures/base-test.js';
import logger from 'jetpack-e2e-commons/logger.js';
import BlockEditorPage from 'jetpack-e2e-commons/pages/wp-admin/block-editor.js';
import { connect } from '../flows/index.js';

test.beforeEach( async ( { page } ) => {
	await prerequisitesBuilder( page )
		.withCleanEnv()
		.withActivePlugins( [ 'social' ] )
		.withInactivePlugins( [ 'jetpack' ] )
		.withLoggedIn( true )
		.withWpComLoggedIn( true )
		.build();
} );

test( 'Jetpack Social sidebar', async ( { page } ) => {
	await test.step( 'Connect wordpress.com account', async () => {
		await connect( page );
	} );

	await test.step( 'Goto post edit page', async () => {
		logger.action( 'Hover over "Posts" in admin menu' );
		await page.getByRole( 'link', { name: 'Posts', exact: true } ).hover();

		logger.action( 'Click on "Add New Post" in admin menu' );
		await page.getByRole( 'link', { name: 'Add New Post' } ).click();

		/**
		 * @type {BlockEditorPage}
		 */
		const blockEditor = await BlockEditorPage.init( page );

		await page.waitForURL( '**/post-new.php' );
		await blockEditor.waitForEditor();

		logger.action( 'Close "Welcome to the block editor" dialog' );
		await blockEditor.closeWelcomeGuide();

		await blockEditor.setTitle( 'Jetpack Social test post' );
	} );

	await test.step( 'Check Social sidebar', async () => {
		logger.action( 'Open Jetpack Social sidebar' );
		await page.getByRole( 'button', { name: 'Jetpack Social', exact: true } ).click();

		logger.action( 'Checking for "Preview" button' );
		const previewButton = page.getByRole( 'button', { name: 'Open Social Previews', exact: true } );
		await expect( previewButton ).toBeVisible();
	} );
} );
