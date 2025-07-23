import { prerequisitesBuilder } from '_jetpack-e2e-commons/env/prerequisites.js';
import { expect, test } from '_jetpack-e2e-commons/fixtures/base-test.ts';
import logger from '_jetpack-e2e-commons/logger.js';
import BlockEditorPage from '_jetpack-e2e-commons/pages/wp-admin/block-editor.js';
import { disconnect } from '_jetpack-e2e-commons/utils/index.ts';
import { connect } from '../flows/index.js';

test.beforeEach( async ( { page, requestUtils } ) => {
	await disconnect( requestUtils );

	await prerequisitesBuilder( page )
		.withActivePlugins( [ 'jetpack-social' ] )
		.withInactivePlugins( [ 'jetpack' ] )
		.build();
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
