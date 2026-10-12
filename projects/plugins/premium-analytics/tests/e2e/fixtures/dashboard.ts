import { test as base, expect } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import type { TestUtils } from '@automattic/_jetpack-e2e-commons/utils/index';
import type { Locator, Page } from '@playwright/test';

export type SiteState = { enabled: boolean; subscriptions: boolean; wordads: boolean };

// The welcome dialog marks everything behind it inert, so specs start with onboarding done.
const ONBOARDED_PREFERENCES =
	'{"jetpack-premium-analytics/dashboard":{"onboardingCompletedAt":"2026-01-01T00:00:00.000Z"},"_modified":"2026-01-01T00:00:00.000Z"}';

/**
 * Puts the site in one dashboard state from scratch, so no spec depends on the one before it.
 *
 * @param testUtils - e2e-commons test utilities.
 * @param state     - Opt-in option and the modules that gate sections.
 */
export async function setSiteState( testUtils: TestUtils, state: SiteState ) {
	await testUtils.executeWpCommand(
		`option update jetpack_premium_analytics_enabled ${ state.enabled ? 1 : 0 }`
	);
	await testUtils.executeWpCommand( [
		'user',
		'meta',
		'update',
		'1',
		'wp_persisted_preferences',
		ONBOARDED_PREFERENCES,
		'--format=json',
	] );
	await testUtils.activateModule( 'stats' );
	if ( state.subscriptions ) {
		await testUtils.activateModule( 'subscriptions' );
	} else {
		await testUtils.deactivateModule( 'subscriptions' );
	}
	if ( state.wordads ) {
		// WordAds only activates on a plan that includes it, and the mocked plan lands on the next refresh.
		await testUtils.setMockPlanData( 'jetpack_complete' );
		await testUtils.executeWpCommand( [
			'eval',
			'Automattic\\Jetpack\\Current_Plan::refresh_from_wpcom();',
		] );
		await testUtils.activateModule( 'wordads' );
	} else {
		await testUtils.deactivateModule( 'wordads' );
	}
}

export class Dashboard {
	readonly errors: string[] = [];

	constructor( readonly page: Page ) {
		page.on( 'pageerror', error => this.errors.push( `pageerror: ${ error.message }` ) );
		// The rest of wp-admin fails loudly under a fake connection, so only the dashboard's own requests count.
		page.on( 'response', response => {
			const url = decodeURIComponent( response.url() );
			const isOwn =
				url.includes( 'jetpack-premium-analytics' ) || url.includes( '/wpcom/v2/dashboards/' );
			if ( isOwn && response.status() >= 400 ) {
				this.errors.push( `${ response.status() } ${ url }` );
			}
		} );
	}

	async open( path = '/' ) {
		await this.page.goto(
			`./wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin&p=${ encodeURIComponent( path ) }`
		);
	}

	tab( name: string ): Locator {
		return this.page.getByRole( 'tab', { name, exact: true } );
	}
}

export const test = base.extend< { dashboard: Dashboard } >( {
	dashboard: async ( { page }, use ) => {
		await page.route( /pixel\.wp\.com/, route => route.abort() );
		await use( new Dashboard( page ) );
	},
} );

export { expect };
