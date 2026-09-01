import logger from '@automattic/_jetpack-e2e-commons/logger';
import { JetpackOnboarding } from '@automattic/_jetpack-e2e-commons/utils/jetpack-onboarding';
import type { Page } from '@playwright/test';

export class Onboarding extends JetpackOnboarding {
	constructor( page: Page ) {
		super( page, {
			CTALabel: 'Supercharge my site',
			adminPageSlug: 'my-jetpack',
		} );
	}

	/**
	 * Close the onboarding tour dialog, if it is open.
	 *
	 * @return A promise that resolves when the dialog is closed.
	 */
	async closeOnboardingTour() {
		const dialog = this.page.getByRole( 'dialog', { name: 'Welcome to Jetpack' } );

		if ( ! ( await dialog.isVisible() ) ) {
			logger.info( 'Onboarding tour dialog is not visible. No need to close it.' );
			return;
		}
		logger.info( 'Onboarding tour dialog is visible. Closing it.' );

		await dialog.getByRole( 'button', { name: 'Close' } ).click();
	}
}
