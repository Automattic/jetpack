/**
 * Browser side of JETPACK-2685 steps 2 and 3: loads a page with Playwright and pulls a
 * snapshot of its geometry and network traffic. Needs a real Chromium -- not covered by
 * the unit tests in this directory, which exercise diff.js and report.js against fixtures
 * instead. See README.md for how a reviewer runs this against a live site.
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
	await page.goto( `${ origin }/wp-login.php`, { waitUntil: 'networkidle' } );
	await page.fill( '#user_login', username );
	await page.fill( '#user_pass', password );
	await Promise.all( [
		page.waitForNavigation( { waitUntil: 'networkidle' } ),
		page.click( '#wp-submit' ),
	] );
}

/**
 * Read one target's rect + computed style out of the page. Runs inside the browser via
 * `page.evaluate`, so it can only use DOM APIs -- no imports from this module reach it.
 *
 * @param {object} targetsArg - `{ [key]: { label, selector } }`, control's selector resolved by the caller.
 * @return {object} `{ [key]: { label, rect, style } }` for every target whose selector matched.
 */
/* c8 ignore start -- runs inside the browser context; exercised only by a live capture. */
function extractGeometryInPage( targetsArg ) {
	/**
	 * @param {Element} el
	 * @return {{x: number, y: number, width: number, height: number}}
	 */
	function readRect( el ) {
		const r = el.getBoundingClientRect();
		return {
			x: Math.round( r.x ),
			y: Math.round( r.y ),
			width: Math.round( r.width ),
			height: Math.round( r.height ),
		};
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
		const el = document.querySelector( target.selector );
		if ( ! el ) {
			continue;
		}
		out[ key ] = {
			label: target.label,
			rect: readRect( el ),
			style: readStyle( el, key === 'control' ),
		};
	}
	return out;
}
/* c8 ignore stop */

/**
 * Capture one snapshot: navigate (logging in first if credentials are given), wait for
 * the page to settle, then read geometry for `targets` and every response since navigation
 * started.
 *
 * @param {object}  options
 * @param {string}  options.url               - Page to capture.
 * @param {string}  [options.username]        - wp-admin username; skips login if omitted.
 * @param {string}  [options.password]        - wp-admin password.
 * @param {string}  [options.controlSelector] - CSS selector for the one control to box-model. Skipped if omitted.
 * @param {string}  [options.waitForSelector] - Extra selector to wait for (visible) after navigation, e.g. the boot mount when the flag is on.
 * @param {object}  [options.targets]         - Selector config; defaults to `DEFAULT_GEOMETRY_TARGETS`.
 * @param {boolean} [options.headless]        - Defaults to true.
 * @return {Promise<{meta: object, geometry: object, network: object[]}>} The captured snapshot.
 */
export async function capturePage( options ) {
	const {
		url,
		username,
		password,
		controlSelector,
		waitForSelector,
		targets = DEFAULT_GEOMETRY_TARGETS,
		headless = true,
	} = options;

	const resolvedTargets = controlSelector
		? { ...targets, control: { ...targets.control, selector: controlSelector } }
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

		if ( username && password ) {
			await login( page, url, username, password );
		}

		await page.goto( url, { waitUntil: 'networkidle' } );
		if ( waitForSelector ) {
			await page.waitForSelector( waitForSelector, { state: 'visible' } );
			await page.waitForLoadState( 'networkidle' );
		}

		const geometry = await page.evaluate( extractGeometryInPage, resolvedTargets );

		return {
			meta: { url, capturedAt: new Date().toISOString() },
			geometry,
			network,
		};
	} finally {
		await browser.close();
	}
}
