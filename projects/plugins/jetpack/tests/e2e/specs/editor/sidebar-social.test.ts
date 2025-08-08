import { expect, test } from '@fixtures/base-test';
import logger from '@logger';

test.describe( 'Editor sidebar: Social', () => {
	test( 'Activation of publicize from the editor', async ( { admin, editor } ) => {
		await admin.createNewPost( { title: 'Testing Social Sidebar' } );

		logger.debug( 'Open Jetpack sidebar' );

		await editor.openSettings( 'Jetpack' );

		const settingsSidebar = editor.getEditorSettingsSidebar();

		const socialPanel = settingsSidebar.getByRole( 'button', {
			name: 'Share this post',
		} );

		logger.debug( 'Expand "Share this post" panel' );
		await socialPanel.click();

		const activateSocialLink = settingsSidebar.getByRole( 'link', {
			name: 'Activate Jetpack Social',
		} );

		await expect( activateSocialLink ).toBeVisible();
	} );
} );
