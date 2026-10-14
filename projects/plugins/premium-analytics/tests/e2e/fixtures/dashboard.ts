import { test as base, expect } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import type { TestUtils } from '@automattic/_jetpack-e2e-commons/utils/index';
import type { Locator, Page } from '@playwright/test';

export type SiteState = {
	enabled: boolean;
	subscriptions: boolean;
	wordads: boolean;
	timezone?: string;
};

// The welcome dialog marks everything behind it inert, so specs start with onboarding done.
const ONBOARDED_PREFERENCES =
	'{"jetpack-premium-analytics/dashboard":{"onboardingCompletedAt":"2026-01-01T00:00:00.000Z"},"_modified":"2026-01-01T00:00:00.000Z"}';

// The rest of wp-admin fails loudly under a fake connection, so only the dashboard's own scripts and routes count.
const OWN_URL_PARTS = [
	'jetpack-premium-analytics',
	'/wpcom/v2/dashboards/',
	'/wpcom/v2/widget-modules',
];
const isOwn = ( text: string ) => OWN_URL_PARTS.some( part => text.includes( part ) );

/**
 * Puts the site in one dashboard state from scratch, so no spec depends on the one before it.
 *
 * @param testUtils - e2e-commons test utilities.
 * @param state     - Opt-in option, the modules that gate sections, and the site timezone (UTC by default).
 */
export async function setSiteState( testUtils: TestUtils, state: SiteState ) {
	await testUtils.executeWpCommand( [
		'option',
		'update',
		'timezone_string',
		state.timezone ?? 'UTC',
	] );
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
	// WordAds only activates on a plan that includes it, and the mocked plan lands on the next refresh.
	await testUtils.setMockPlanData( state.wordads ? 'jetpack_complete' : 'jetpack_free' );
	await testUtils.executeWpCommand( [
		'eval',
		'Automattic\\Jetpack\\Current_Plan::refresh_from_wpcom();',
	] );
	if ( state.wordads ) {
		await testUtils.activateModule( 'wordads' );
	} else {
		await testUtils.deactivateModule( 'wordads' );
	}
}

export class Dashboard {
	readonly errors: string[] = [];

	constructor( readonly page: Page ) {
		page.on( 'pageerror', error => {
			// A script that fails to parse or import has no stack; a failed import names its URL in the message.
			if ( isOwn( `${ error.message }\n${ error.stack }` ) ) {
				this.errors.push( `pageerror: ${ error.message }` );
			}
		} );
		page.on( 'response', response => {
			const type = response.request().resourceType();
			const url = decodeURIComponent( response.url() );
			// The opted-out case expects a 403 page, and a broken page fails the specs' own assertions.
			if ( type === 'document' || ! isOwn( url ) ) {
				return;
			}
			const contentType = response.headers()[ 'content-type' ] ?? '';
			if ( response.status() >= 400 ) {
				this.errors.push( `${ response.status() } ${ url }` );
			} else if ( type === 'script' && contentType.includes( 'text/html' ) ) {
				// A module script served as HTML is refused without a page error.
				this.errors.push( `${ contentType } ${ url }` );
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

	async expectTabHidden( name: string ) {
		// A hidden tab can't be told apart from one that hasn't rendered yet, so wait for Traffic first.
		await expect( this.tab( 'Traffic' ) ).toBeVisible();
		await expect( this.tab( name ) ).toHaveCount( 0 );
	}
}

export const test = base.extend< { dashboard: Dashboard } >( {
	dashboard: async ( { page }, use ) => {
		await page.route( /pixel\.wp\.com/, route => route.abort() );
		const dashboard = new Dashboard( page );
		await use( dashboard );
		expect( dashboard.errors, 'Dashboard errors' ).toEqual( [] );
	},
} );

export { expect };
