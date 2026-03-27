import logger from '../logger';
import type { Page } from '@playwright/test';

type JetpackOnboardingConfig = {
	/**
	 * The label of the CTA button that starts the onboarding process. Defaults to "Supercharge my site".
	 */
	CTALabel?: string;

	/**
	 * The slug of the admin page to which we are redirected after approving the connection. Defaults to "my-jetpack".
	 *
	 * Alternatively, you can extend the `JetpackOnboarding` class and override the `waitForRedirectFromWpcom` method to provide a custom implementation for waiting for the redirect after approving the connection.
	 */
	adminPageSlug?: string;

	/**
	 * The label of the button on the wp.com connect page to approve the connection. Defaults to "Connect account".
	 */
	wpcomApproveButtonLabel?: string;
};

type RedirectToWpcomOptions = {
	wpcomLoggedIn?: boolean;
};

/**
 * A helper class for automating the Jetpack onboarding process in E2E tests.
 */
export class JetpackOnboarding {
	/**
	 * Onboarding API calls and redirects can take a while to complete, so we increase the timeout.
	 */
	static DEFAULT_TIMEOUT = 60000;

	static SITE_CONNECTION_ENDPOINTS = [
		'jetpack/v4/connection/authorize_url',
		'jetpack/v4/connection/register',
	] as const;

	protected page: Page;
	protected config: JetpackOnboardingConfig;

	constructor( page: Page, config: JetpackOnboardingConfig = {} ) {
		this.page = page;
		this.config = {
			CTALabel: 'Supercharge my site',
			adminPageSlug: 'my-jetpack',
			wpcomApproveButtonLabel: 'Connect account',
			...config,
		};
	}

	get CTA() {
		return this.page.getByRole( 'button', {
			name: this.config.CTALabel,
		} );
	}

	/**
	 * Start the onboarding process by clicking the CTA button.
	 *
	 * @return A promise that resolves after the CTA button is clicked.
	 */
	async start() {
		logger.info( `Click on "${ this.config.CTALabel }" button to start onboarding` );

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
				const url = new URL( response.url() );

				// Check the pathname for pretty permalinks.
				if (
					JetpackOnboarding.SITE_CONNECTION_ENDPOINTS.some( endpoint =>
						url.pathname.includes( endpoint )
					)
				) {
					return true;
				}

				const rest_route = url.searchParams.get( 'rest_route' );

				// Check the rest_route param for ugly permalinks.
				if (
					rest_route &&
					JetpackOnboarding.SITE_CONNECTION_ENDPOINTS.some( endpoint =>
						rest_route.includes( endpoint )
					)
				) {
					return true;
				}

				return false;
			},
			{ timeout: JetpackOnboarding.DEFAULT_TIMEOUT }
		);
	}

	/**
	 * Wait for the redirect to the wp.com connect page.
	 *
	 * @param options - Options.
	 *
	 * @return A promise that resolves when the redirect to the wp.com connect page is completed.
	 */
	async waitForRedirectToWpcom( options?: RedirectToWpcomOptions ) {
		const opts = { wpcomLoggedIn: true, ...options };

		const wpcomUrl = opts.wpcomLoggedIn
			? 'https://wordpress.com/jetpack/connect/authorize**'
			: 'https://wordpress.com/log-in/jetpack**';

		return await this.page.waitForURL( wpcomUrl, { timeout: JetpackOnboarding.DEFAULT_TIMEOUT } );
	}

	/**
	 * Wait for the redirect from the wp.com connect page.
	 *
	 * @param baseURL - The base URL of the site.
	 *
	 * @return A promise that resolves when the redirect from the wp.com connect page is completed.
	 */
	async waitForRedirectFromWpcom( baseURL?: string ) {
		const baseOrigin = baseURL ? new URL( baseURL ).origin : undefined;
		return await this.page.waitForURL(
			url => {
				return (
					( ! baseOrigin || url.origin === baseOrigin ) &&
					url.pathname.includes( 'wp-admin/admin.php' ) &&
					url.searchParams.get( 'page' ) === this.config.adminPageSlug
				);
			},
			{ timeout: JetpackOnboarding.DEFAULT_TIMEOUT }
		);
	}

	/**
	 * Approves the user connection by clicking on the approve button.
	 * It assumes that
	 * - the user is already logged in to wp.com.
	 * - we are on the wp.com connect page.
	 *
	 *
	 * @return A promise that resolves when the connect account button is clicked.
	 */
	async approveConnection() {
		logger.info( 'Click on the approve button and wait for redirect from wp.com connect page' );

		await this.page
			.getByRole( 'button', { name: this.config.wpcomApproveButtonLabel, exact: true } )
			.click();
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
		await Promise.all( [
			// Start onboarding and wait for site connection to complete
			this.start(),
			this.waitForSiteConnection(),
		] );

		await this.waitForRedirectToWpcom();

		await Promise.all( [
			// Approve connection and wait for redirect back to the site
			this.approveConnection(),
			this.waitForRedirectFromWpcom( baseURL ),
		] );
	}
}
