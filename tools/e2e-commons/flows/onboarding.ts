import logger from '../logger';
import type { Page } from '@playwright/test';

type RedirectToWpcomOptions = {
	wpcomLoggedIn?: boolean;
};

// Onboarding API calls and redirects can take a while to complete, so we increase the timeout.
const DEFAULT_TIMEOUT = 60000;

export class Onboarding {
	constructor( protected page: Page ) {}

	get CTA() {
		return this.page.getByRole( 'button', { name: 'Supercharge my site' } );
	}

	/**
	 * Start the onboarding process by clicking the CTA button.
	 *
	 * @return A promise that resolves when the site connection is completed.
	 */
	async start() {
		logger.info( 'Click on "Supercharge my site" button to start onboarding' );

		await this.CTA.click();
	}

	/**
	 * Wait for site connection to complete.
	 *
	 * @return A promise that resolves when the site connection is completed.
	 */
	async waitForSiteConnection() {
		logger.info( 'Waiting for site connection to finish.' );

		return await this.page.waitForResponse(
			response => {
				return response.url().includes( 'jetpack/v4/connection/register' );
			},
			{ timeout: DEFAULT_TIMEOUT }
		);
	}

	/**
	 * Wait for the redirect to the wp.com connect page.
	 *
	 * @param {StartOnboardingOptions} options - Options.
	 *
	 * @return A promise that resolves when the redirect to the wp.com connect page is completed.
	 */
	async waitForRedirectToWpcom( options?: RedirectToWpcomOptions ) {
		const opts = { wpcomLoggedIn: true, ...options };

		const wpcomUrl = opts.wpcomLoggedIn
			? 'https://wordpress.com/jetpack/connect/authorize**'
			: 'https://wordpress.com/log-in/jetpack**';

		return await this.page.waitForURL( wpcomUrl, { timeout: DEFAULT_TIMEOUT } );
	}

	/**
	 * Approves the user connection by clicking on the "Approve" button.
	 * It assumes that
	 * - the user is already logged in to wp.com.
	 * - we are on the wp.com connect page.
	 *
	 * @param baseURL - The base URL of the site.
	 *
	 * @return A promise that resolves when we are redirected to the My Jetpack page.
	 */
	async approveConnection( baseURL?: string ) {
		const waitForMyJetpackPage = this.page.waitForURL(
			url => {
				return (
					( ! baseURL || url.origin === baseURL ) &&
					url.pathname.includes( 'wp-admin/admin.php' ) &&
					url.searchParams.get( 'page' ) === 'my-jetpack'
				);
			},
			{ timeout: DEFAULT_TIMEOUT }
		);

		logger.info( 'Click on "Approve" button and wait for redirect to My Jetpack' );

		const approveButton = this.page.getByRole( 'button', { name: 'Approve', exact: true } );

		return Promise.all( [ waitForMyJetpackPage, approveButton.click() ] );
	}

	/**
	 * Onboard the user by starting the onboarding process, waiting for site connection,
	 * waiting for redirect to wp.com, and approving the connection.
	 *
	 * @param baseURL - The base URL of the site.
	 *
	 * @return A promise that resolves when the onboarding process is completed.
	 */
	async onboardUser( baseURL?: string ) {
		const siteConnectionPromise = this.waitForSiteConnection();
		await this.start();
		await siteConnectionPromise;
		await this.waitForRedirectToWpcom();
		await this.approveConnection( baseURL );
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
