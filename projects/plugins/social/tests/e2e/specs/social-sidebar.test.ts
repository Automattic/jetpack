import { expect, test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import { Onboarding } from '../helpers/onboarding';

test.beforeAll( async ( { testUtils } ) => {
	await testUtils.disconnect();
	await testUtils.executeWpCommand( 'option delete jetpack-social_show_pricing_page' );
	await testUtils.requestUtils.deactivatePlugin( 'jetpack' );
	await testUtils.requestUtils.activatePlugin( 'jetpack-social' );
} );

test( 'Jetpack Social sidebar', async ( { page, admin, editor, requestUtils } ) => {
	const onboarding = new Onboarding( page );

	await test.step( 'Connect wordpress.com account', async () => {
		await onboarding.connect( {
			admin,
			baseURL: requestUtils.baseURL!,
		} );
	} );

	await test.step( 'Goto post edit page and create a new post', async () => {
		await admin.createNewPost( { title: 'Jetpack Social test post' } );
	} );

	await test.step( 'Check Social sidebar', async () => {
		await editor.openSettings( 'Jetpack Social' );
		const previewButton = editor
			.getEditorSettingsSidebar()
			.getByRole( 'button', { name: 'Open link preview', exact: true } );
		await expect( previewButton ).toBeVisible();
	} );
} );
