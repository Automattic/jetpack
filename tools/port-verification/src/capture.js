/**
 * Browser side of JETPACK-2685 steps 2 and 3: loads a page with Playwright and pulls a
 * snapshot of its geometry and network traffic. Needs a real Chromium; test/capture.smoke.test.js
 * exercises it against a local stub of wp-admin. See README.md for a run against a live site.
 */

import { chromium } from 'playwright';
import { DEFAULT_GEOMETRY_TARGETS } from './selectors.js';

/**
 * Log in through wp-login.php.
 *
 * @param {import('playwright').Page} page
 * @param {string}                    siteUrl
 * @param {string}                    username
 * @param {string}                    password
 * @return {Promise<void>}
 */
async function login( page, siteUrl, username, password ) {
	const origin = new URL( siteUrl ).origin;
	// Not the caller's --load-state: wp-admin keeps polling (heartbeat, JITM), so gating the
	// login hop on networkidle failed about one run in four. The selector waits below are the
	// real gate, and they say more about being logged in than any load state does.
	await page.goto( `${ origin }/wp-login.php`, { waitUntil: 'domcontentloaded' } );
	await page.waitForSelector( '#loginform', { state: 'attached' } );

	// Jetpack SSO leaves the classic form in the DOM but hidden behind "Log in with username
	// and password", so filling it blind times out on most Jetpack sites. Which class carries
	// that link is not stable -- the visible one is the one to click.
	const ssoToggle = page.locator( '.jetpack-sso-toggle:visible' ).first();
	if ( await ssoToggle.isVisible().catch( () => false ) ) {
		await ssoToggle.click();
		await page.waitForSelector( '#user_login', { state: 'visible' } );
	}

	await page.fill( '#user_login', username );
	await page.fill( '#user_pass', password );

	try {
		await Promise.all( [
			page.waitForURL( '**/wp-admin/**', { waitUntil: 'domcontentloaded' } ),
			page.click( '#wp-submit' ),
		] );
		// Confirm login landed in wp-admin (the Dashboard is the post-login screen) rather than
		// proceeding to capture wp-login.php's own failure page, which would otherwise report
		// every required target as MISSING. Mirrors tools/performance/scripts/measure-lcp.js.
		await page.waitForSelector( '#dashboard-widgets, #wpbody', { timeout: 30000 } );
	} catch {
		throw new Error(
			`Login did not land in wp-admin (still on ${ page.url() }) -- check --user/--pass.`
		);
	}
}

/**
 * A redirect that is not wp-login.php is just as bad: the capture measures whatever it landed
 * on, and two captures of the same wrong page report no differences at all.
 *
 * @param {import('playwright').Page} page
 * @param {string}                    url  - What was requested.
 * @return {void}
 */
function assertLanded( page, url ) {
	const landed = page.url();
	if ( landed.includes( 'wp-login.php' ) ) {
		throw new Error(
			`Landed on wp-login.php instead of ${ url } -- pass --user/--pass, or an --autologin-url.`
		);
	}
	const want = new URL( url );
	const got = new URL( landed );
	if (
		got.pathname !== want.pathname ||
		got.searchParams.get( 'page' ) !== want.searchParams.get( 'page' )
	) {
		throw new Error( `Landed on ${ landed } instead of ${ url } -- a redirect moved the capture.` );
	}
}

/**
 * Read one target's rect + computed style out of the page. Runs inside the browser via
 * `page.evaluate`, so it can only use DOM APIs -- no imports from this module reach it.
 *
 * @param {object} targetsArg - `{ [key]: { label, selector } }`, control's selector resolved by the caller.
 * @return {object} `{ [key]: { label, hidden, matchCount, rect, style } }` for every target whose selector matched.
 */
/* c8 ignore start -- runs inside the browser context; exercised only by a live capture. */
function extractGeometryInPage( targetsArg ) {
	/**
	 * `checkVisibility` walks ancestors, which a computed style on the element alone does not:
	 * a wrapper with `display: none` leaves the child's own `display` untouched while collapsing
	 * its rect to zeros, which would otherwise read as four px deltas.
	 *
	 * @param {Element} el
	 * @return {boolean}
	 */
	function isHidden( el ) {
		return ! el.checkVisibility( { visibilityProperty: true } );
	}

	/**
	 * Unrounded: rounding here would make every delta a whole number, so any tolerance below
	 * 1px would behave exactly like 0. diff.js rounds for display.
	 *
	 * @param {Element} el
	 * @return {{x: number, y: number, width: number, height: number}}
	 */
	function readRect( el ) {
		const r = el.getBoundingClientRect();
		return { x: r.x, y: r.y, width: r.width, height: r.height };
	}

	/**
	 * @param {Element} el
	 * @param {boolean} isControl - Whether to also read the box-model props (margin/border/padding).
	 * @return {object}
	 */
	function readStyle( el, isControl ) {
		const cs = window.getComputedStyle( el );
		const style = { fontFamily: cs.fontFamily };
		if ( isControl ) {
			Object.assign( style, {
				marginTop: parseFloat( cs.marginTop ) || 0,
				marginRight: parseFloat( cs.marginRight ) || 0,
				marginBottom: parseFloat( cs.marginBottom ) || 0,
				marginLeft: parseFloat( cs.marginLeft ) || 0,
				paddingTop: parseFloat( cs.paddingTop ) || 0,
				paddingRight: parseFloat( cs.paddingRight ) || 0,
				paddingBottom: parseFloat( cs.paddingBottom ) || 0,
				paddingLeft: parseFloat( cs.paddingLeft ) || 0,
				borderTopWidth: parseFloat( cs.borderTopWidth ) || 0,
				borderRightWidth: parseFloat( cs.borderRightWidth ) || 0,
				borderBottomWidth: parseFloat( cs.borderBottomWidth ) || 0,
				borderLeftWidth: parseFloat( cs.borderLeftWidth ) || 0,
				boxSizing: cs.boxSizing,
				fontSize: cs.fontSize,
			} );
		}
		return style;
	}

	const out = {};
	for ( const [ key, target ] of Object.entries( targetsArg ) ) {
		if ( ! target.selector ) {
			continue;
		}
		const matches = document.querySelectorAll( target.selector );
		if ( matches.length === 0 ) {
			continue;
		}
		const el = matches[ 0 ];
		out[ key ] = {
			label: target.label,
			hidden: isHidden( el ),
			// querySelector takes the first match, which can be a different element on each
			// side; the diff reports anything above 1 rather than comparing silently.
			matchCount: matches.length,
			rect: readRect( el ),
			style: readStyle( el, key === 'control' ),
		};
	}
	return out;
}
/* c8 ignore stop */

/**
 * Capture one snapshot: navigate (logging in first if credentials are given), wait for
 * the page to settle, then read geometry for `targets` and every request the target page
 * fired.
 *
 * @param {object}  options
 * @param {string}  options.url               - Page to capture.
 * @param {string}  [options.username]        - wp-admin username; skips login if omitted.
 * @param {string}  [options.password]        - wp-admin password.
 * @param {string}  [options.autologinUrl]    - Visited before the target, for a host whose link logs you in (Jurassic Ninja).
 * @param {string}  [options.controlSelector] - CSS selector for the one control to box-model. Skipped if omitted.
 * @param {string}  [options.waitForSelector] - Selector that must be visible after navigation, e.g. the boot mount.
 * @param {string}  [options.absentSelector]  - Selector that must NOT be present; proves the flag is off.
 * @param {string}  [options.loadState]       - Playwright load state to wait for. Defaults to `networkidle`.
 * @param {object}  [options.targets]         - Selector config; defaults to `DEFAULT_GEOMETRY_TARGETS`.
 * @param {boolean} [options.headless]        - Defaults to true.
 * @return {Promise<{meta: object, geometry: object, network: object[]}>} The captured snapshot.
 */
export async function capturePage( options ) {
	const {
		url,
		username,
		password,
		autologinUrl,
		controlSelector,
		waitForSelector,
		absentSelector,
		loadState = 'networkidle',
		targets = DEFAULT_GEOMETRY_TARGETS,
		headless = true,
	} = options;

	// A control that was asked for is required: without this the report calls a control that
	// vanished between captures "optional", which is exactly the renaming a port produces.
	const resolvedTargets = controlSelector
		? { ...targets, control: { ...targets.control, selector: controlSelector, required: true } }
		: targets;

	const browser = await chromium.launch( { headless } );
	try {
		const context = await browser.newContext();
		const page = await context.newPage();

		const network = [];
		page.on( 'response', response => {
			const request = response.request();
			network.push( {
				url: response.url(),
				method: request.method(),
				status: response.status(),
				resourceType: request.resourceType(),
			} );
		} );
		// A request that never gets a response -- bad host, refused connection, CSP block --
		// fires only here. Status 0 keeps it in the same shape as a response.
		page.on( 'requestfailed', request => {
			network.push( {
				url: request.url(),
				method: request.method(),
				status: 0,
				failure: request.failure()?.errorText,
				resourceType: request.resourceType(),
			} );
		} );

		if ( username && password ) {
			await login( page, url, username, password );
		} else if ( autologinUrl ) {
			await page.goto( autologinUrl, { waitUntil: loadState } );
		}
		// Step 3 compares the target page's requests. Drop everything the login flow and the
		// post-login Dashboard fired, or their (partly non-deterministic) traffic is diffed too.
		network.length = 0;

		await page.goto( url, { waitUntil: loadState } );
		assertLanded( page, url );
		if ( absentSelector && ( await page.locator( absentSelector ).count() ) > 0 ) {
			throw new Error(
				`${ absentSelector } is present, but this capture expected it to be absent -- did the flag really change?`
			);
		}
		if ( waitForSelector ) {
			await page.waitForSelector( waitForSelector, { state: 'visible' } );
			await page.waitForLoadState( loadState );
		}

		return {
			meta: { url, capturedAt: new Date().toISOString(), targets: resolvedTargets },
			geometry: await page.evaluate( extractGeometryInPage, resolvedTargets ),
			network,
		};
	} finally {
		await browser.close();
	}
}
