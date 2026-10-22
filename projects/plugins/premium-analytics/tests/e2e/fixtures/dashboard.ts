import { test as base, expect } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
import type { TestUtils } from '@automattic/_jetpack-e2e-commons/utils/index';
import type { Locator, Page, Request } from '@playwright/test';

export type SiteState = {
	enabled: boolean;
	subscriptions: boolean;
	wordads: boolean;
	timezone?: string;
	tier?: 'free' | 'legacy-basic';
	rememberedPreset?: 'last-30-days' | 'year-to-date';
};

export type HistoryWrites = { push: number; replace: number };

type HistoryWritesWindow = Window & { e2eHistoryWrites: HistoryWrites };

export type StatsFault = {
	route: string;
	status: number;
	error: string;
	message: string;
};

// The rest of wp-admin fails loudly under a fake connection, so only the dashboard's own scripts and routes count.
const OWN_URL_PARTS = [
	'jetpack-premium-analytics',
	'/wpcom/v2/dashboards/',
	'/wpcom/v2/widget-modules',
];
const isOwn = ( text: string ) => OWN_URL_PARTS.some( part => text.includes( part ) );

const isStatsRequest = ( request: Request ) =>
	decodeURIComponent( request.url() ).includes( '/jetpack-premium-analytics/v1/proxy/' );

// The app writes `p` encoded once more than `open()` does.
export const route = ( url: URL ) => decodeURIComponent( url.searchParams.get( 'p' ) ?? '' );

// Not URLSearchParams: a raw `+` in an offset must stay a `+`.
export const routeParam = ( url: URL, name: string ) =>
	route( url ).match( new RegExp( `[?&]${ name }=([^&]*)` ) )?.[ 1 ];

/**
 * Puts the site in one dashboard state from scratch, so no spec depends on the one before it.
 *
 * @param testUtils - e2e-commons test utilities.
 * @param state     - Opt-in option, the modules that gate sections, the site timezone (UTC by default), a forced Stats tier and the remembered preset.
 */
export async function setSiteState( testUtils: TestUtils, state: SiteState ) {
	const { rememberedPreset, ...rest } = state;
	// Do not reorder: the helper's plan refresh reads the mocked plan.
	await testUtils.setMockPlanData( state.wordads ? 'jetpack_complete' : 'jetpack_free' );
	await testUtils.requestUtils.rest( {
		method: 'POST',
		path: '/e2e-premium-analytics/v1/site-state',
		data: { ...rest, timezone: state.timezone ?? 'UTC', remembered_preset: rememberedPreset },
	} );
}

/**
 * Makes WordPress.com answer one Stats route with its error envelope, or answer normally again.
 *
 * @param testUtils - e2e-commons test utilities.
 * @param fault     - The route, status and envelope, or null to clear it.
 */
export async function setStatsFault( testUtils: TestUtils, fault: StatsFault | null ) {
	if ( ! fault ) {
		// Transients stay: a failure the proxy wrongly cached must still show.
		await testUtils.executeWpCommand( [ 'eval', "delete_option( 'e2e_pa_stats_fault' );" ] );
		return;
	}
	await testUtils.executeWpCommand( [
		'option',
		'update',
		'e2e_pa_stats_fault',
		JSON.stringify( fault ),
		'--format=json',
	] );
	// The proxy would answer from a cached success.
	await testUtils.executeWpCommand( 'transient delete --all' );
}

/**
 * Shortens nonces so the dashboard's expires mid-session. `setSiteState()` restores the default.
 *
 * @param testUtils - e2e-commons test utilities.
 * @param seconds   - Nonce lifetime in seconds.
 */
export async function setNonceLife( testUtils: TestUtils, seconds: number ) {
	await testUtils.executeWpCommand( `option update e2e_pa_nonce_life ${ seconds }` );
}

export class Dashboard {
	readonly errors: string[] = [];

	private readonly allowed: RegExp[] = [];

	private readonly pending: Promise< void >[] = [];

	private statsRequests: URL[] = [];

	private statsInFlight = 0;

	private lastStatsActivity = 0;

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
				// The body's error code tells a refusal a spec expects from a real failure.
				this.pending.push(
					response
						.json()
						.then(
							body => body?.code ?? body?.error ?? '',
							() => ''
						)
						.then( code => {
							const entry = `${ response.status() } ${ url } ${ code }`.trim();
							if ( ! this.allowed.some( pattern => pattern.test( entry ) ) ) {
								this.errors.push( entry );
							}
						} )
				);
			} else if ( type === 'script' && contentType.includes( 'text/html' ) ) {
				// A module script served as HTML is refused without a page error.
				this.errors.push( `${ contentType } ${ url }` );
			}
		} );
		page.on( 'request', request => {
			if ( ! isStatsRequest( request ) ) {
				return;
			}
			this.statsRequests.push( new URL( decodeURIComponent( request.url() ) ) );
			this.statsInFlight++;
			this.lastStatsActivity = Date.now();
		} );
		const settle = ( request: Request ) => {
			if ( ! isStatsRequest( request ) ) {
				return;
			}
			this.statsInFlight--;
			this.lastStatsActivity = Date.now();
		};
		page.on( 'requestfinished', settle );
		page.on( 'requestfailed', settle );
	}

	/**
	 * Waits until no Stats request has been in flight for a moment, since some widgets send a follow-up once the first reply lands.
	 * The quiet time counts from the call too: a page can render before its widgets send anything.
	 */
	async waitForStatsIdle() {
		const since = Date.now();
		await expect
			.poll(
				() =>
					this.statsInFlight === 0 && Date.now() - Math.max( this.lastStatsActivity, since ) > 500,
				{ message: 'Stats requests kept going', intervals: [ 250 ] }
			)
			.toBe( true );
	}

	/**
	 * The Stats endpoints requested in this test, or since the last `resetTracking()`.
	 *
	 * @return Endpoint names such as `visits` or `referrers`, sorted.
	 */
	statsEndpoints(): string[] {
		const endpoints = this.statsRequests.map(
			url => url.href.match( /\/stats\/([^?&]+)/ )?.[ 1 ] ?? ''
		);
		return [ ...new Set( endpoints.filter( Boolean ) ) ].sort();
	}

	/**
	 * The windows `stats/visits` was asked for in this test, or since the last `resetTracking()`.
	 *
	 * @return `start_date..date` pairs, sorted.
	 */
	visitsWindows(): string[] {
		const day = ( url: URL, name: string ) => url.searchParams.get( name )?.slice( 0, 10 );
		const windows = this.statsRequests
			.filter( url => url.href.includes( '/stats/visits' ) )
			.map( url => `${ day( url, 'start_date' ) }..${ day( url, 'date' ) }` );
		return [ ...new Set( windows ) ].sort();
	}

	async open( path = '/' ) {
		await this.page.goto(
			`./wp-admin/admin.php?page=jetpack-premium-analytics-wp-admin&p=${ encodeURIComponent( path ) }`
		);
	}

	/**
	 * Stops counting error responses whose `<status> <url> <error code>` entry matches the pattern.
	 *
	 * @param pattern - Matched against the entry, e.g. `/^403 .* rest_cookie_invalid_nonce$/`.
	 */
	allowErrors( pattern: RegExp ) {
		this.allowed.push( pattern );
	}

	/** Waits for the error bodies still being read, so the teardown check sees every error. */
	async settled() {
		await Promise.all( this.pending );
	}

	tab( name: string ): Locator {
		return this.page.getByRole( 'tab', { name, exact: true } );
	}

	periodControl(): Locator {
		// Its name is the period itself, so only its class tells it from the comparison and interval controls.
		return this.page.locator( '.date-period-dropdown__toggle' );
	}

	viewsTab( total: number ): Locator {
		// The comparison may follow the total, as in "Views 10 +11%".
		return this.page.getByRole( 'tab', { name: new RegExp( `^Views ${ total }( |$)` ) } );
	}

	async clickInWidget( target: Locator ) {
		// eslint-disable-next-line playwright/no-force-option -- Each widget sits in the grid's aria-disabled sortable button, so Playwright reads its contents as disabled.
		await target.click( { force: true } );
	}

	/** Clears the recorded Stats requests and history writes, so a spec counts only what one action causes. */
	async resetTracking() {
		this.statsRequests = [];
		await this.page.evaluate( () => {
			( window as unknown as HistoryWritesWindow ).e2eHistoryWrites = { push: 0, replace: 0 };
		} );
	}

	/**
	 * The history writes since the page loaded or the last `resetTracking()`.
	 *
	 * @return The `pushState` and `replaceState` call counts.
	 */
	async historyWrites(): Promise< HistoryWrites > {
		return this.page.evaluate(
			() => ( window as unknown as HistoryWritesWindow ).e2eHistoryWrites
		);
	}

	snackbar( text: string | RegExp ): Locator {
		return this.page.locator( '.components-snackbar' ).filter( { hasText: text } );
	}

	async expectTabHidden( name: string ) {
		// A hidden tab can't be told apart from one that hasn't rendered yet, so wait for Traffic first.
		await expect( this.tab( 'Traffic' ) ).toBeVisible();
		await expect( this.tab( name ) ).toHaveCount( 0 );
	}
}

/**
 * Counts history writes, run as an init script so it wraps `history` before the app's first write.
 */
function countHistoryWrites() {
	const counted = window as unknown as HistoryWritesWindow;
	counted.e2eHistoryWrites = { push: 0, replace: 0 };
	const { pushState, replaceState } = window.history;
	window.history.pushState = function ( ...args: Parameters< History[ 'pushState' ] > ) {
		counted.e2eHistoryWrites.push++;
		return pushState.apply( this, args );
	};
	window.history.replaceState = function ( ...args: Parameters< History[ 'replaceState' ] > ) {
		counted.e2eHistoryWrites.replace++;
		return replaceState.apply( this, args );
	};
}

export const test = base.extend< { dashboard: Dashboard } >( {
	dashboard: async ( { page }, use ) => {
		await page.route( /pixel\.wp\.com/, pixel => pixel.abort() );
		await page.addInitScript( countHistoryWrites );
		const dashboard = new Dashboard( page );
		await use( dashboard );
		await dashboard.settled();
		expect( dashboard.errors, 'Dashboard errors' ).toEqual( [] );
	},
} );

export { expect };
