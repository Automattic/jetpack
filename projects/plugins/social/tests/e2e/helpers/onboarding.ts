import { Admin } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import logger from '@automattic/_jetpack-e2e-commons/logger';
import { JetpackOnboarding } from '@automattic/_jetpack-e2e-commons/utils/jetpack-onboarding';
import type { Page } from '@playwright/test';

export class Onboarding extends JetpackOnboarding {
	constructor( page: Page ) {
		super( page, {
			CTALabel: 'Get Started',
			adminPageSlug: 'jetpack-social',
			wpcomApproveButtonLabel: 'Approve',
		} );
	}

	/**
	 * Connect a user's WordPress.com account to Jetpack
	 *
	 * @param {{ admin: Admin; baseURL: string }} options - The options for connecting the account.
	 */
	async connect( { admin, baseURL }: { admin: Admin; baseURL: string } ) {
		await admin.visitAdminPage( 'admin.php', 'page=jetpack-social' );

		await this.onboardUser( baseURL );

		logger.debug( 'Selecting free plan' );
		await this.page.getByRole( 'button', { name: 'Start for free' } ).click();
	}
}
