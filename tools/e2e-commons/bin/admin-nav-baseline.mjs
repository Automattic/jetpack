#!/usr/bin/env node
/*
 * Measure how fast Jetpack wp-build dashboards open from the wp-admin sidebar.
 * See tools/e2e-commons/bin/admin-nav-baseline.md for what is measured and how to run it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium, firefox, webkit } from '@playwright/test';

const DASHBOARDS = [
	{ name: 'My Jetpack', pages: [ 'my-jetpack' ] },
	{ name: 'Settings', pages: [ 'jetpack-settings' ] },
	{ name: 'Forms', pages: [ 'jetpack-forms-responses-wp-admin', 'jetpack-forms-admin' ] },
	{ name: 'Newsletter', pages: [ 'jetpack-newsletter' ] },
	{ name: 'Activity Log', pages: [ 'jetpack-activity-log' ] },
	{ name: 'Backup', pages: [ 'jetpack-backup' ] },
	{ name: 'Podcast', pages: [ 'jetpack-podcast' ] },
	{ name: 'Search', pages: [ 'jetpack-search' ] },
	{ name: 'Social', pages: [ 'jetpack-social' ] },
	{ name: 'VideoPress', pages: [ 'jetpack-videopress' ] },
	{ name: 'Jetpack AI', pages: [ 'jetpack-ai' ] },
];
const BROWSERS = { chromium, firefox, webkit };

const { values: args } = parseArgs( {
	options: {
		site: { type: 'string' },
		user: { type: 'string', default: process.env.WP_USER || 'demo' },
		label: { type: 'string', default: 'run' },
		browsers: { type: 'string', default: 'chromium,firefox,webkit' },
		runs: { type: 'string', default: '5' },
		passes: { type: 'string', default: '2' },
		warmup: { type: 'string', default: '8000' },
		quiet: { type: 'string', default: '2000' },
		timeout: { type: 'string', default: '30000' },
		'cpu-throttle': { type: 'string', default: '1' },
		out: { type: 'string', default: 'admin-nav-baseline-results' },
		state: { type: 'string' },
	},
} );
if ( ! args.site ) {
	console.error(
		'Usage: admin-nav-baseline.mjs --site https://example.jurassic.ninja [--label trunk] [--runs 5]'
	);
	process.exit( 1 );
}
const site = args.site.replace( /\/$/, '' );
args.state ??= path.join( args.out, `${ new URL( site ).hostname }.state.json` );
fs.mkdirSync( args.out, { recursive: true } );
const QUIET = Number( args.quiet );
const TIMEOUT = Number( args.timeout );

/**
 * Runs in every document from its first byte. It notes when a visible page header first appears
 * and when the DOM last changed, in epoch ms, so one clock spans full page loads and in-document
 * switches alike.
 */
function recorder() {
	/* global document, window, MutationObserver */
	const now = () => performance.timeOrigin + performance.now();
	const HEADERS =
		'.admin-ui-navigable-region > [class*="__header"] h1, #wpbody-content h1, #wpbody-content [role="heading"][aria-level="1"]';
	const visible = el =>
		el.textContent.trim() &&
		( el.checkVisibility ? el.checkVisibility( { visibilityProperty: true } ) : el.offsetParent );
	const state = ( window.__navState = { before: null, header: null, last: now() } );
	const check = () => {
		state.last = now();
		if ( ! state.header ) {
			const h = [ ...document.querySelectorAll( HEADERS ) ].find(
				el => visible( el ) && el !== state.before
			);
			if ( h ) {
				state.header = state.last;
			}
		}
	};
	window.__navReset = () => {
		const current = [ ...document.querySelectorAll( HEADERS ) ].find( visible );
		Object.assign( state, { before: current || null, header: null, last: now() } );
	};
	new MutationObserver( check ).observe( document, {
		childList: true,
		subtree: true,
		characterData: true,
		attributes: true,
		attributeFilter: [ 'class', 'style', 'hidden', 'inert' ],
	} );
}

/**
 * Wait until the DOM has not changed for QUIET ms, and return the recorder's state.
 *
 * @param {import('@playwright/test').Page} page - Page to watch.
 * @return {Promise<object>} Recorder state, plus whether the page settled.
 */
async function settle( page ) {
	const deadline = Date.now() + TIMEOUT;
	for (;;) {
		// eslint-disable-next-line playwright/no-wait-for-timeout -- Polling for a quiet DOM is the measurement.
		await page.waitForTimeout( 250 );
		const s = await page.evaluate( () => globalThis.__navState ).catch( () => null );
		if ( s && Date.now() - s.last >= QUIET ) {
			return { ...s, settled: true };
		}
		if ( Date.now() > deadline ) {
			return { ...( s || {} ), settled: false };
		}
	}
}

/**
 * Used JS heap after a forced GC, in MB. Chromium only.
 *
 * @param {import('@playwright/test').Page}       page - Page to measure.
 * @param {import('@playwright/test').CDPSession} cdp  - CDP session, or null outside Chromium.
 * @return {Promise<number|null>} Heap size.
 */
async function heapMB( page, cdp ) {
	if ( ! cdp ) {
		return null;
	}
	await cdp.send( 'HeapProfiler.collectGarbage' );
	const { usedSize } = await cdp.send( 'Runtime.getHeapUsage' );
	return Math.round( ( usedSize / 1048576 ) * 10 ) / 10;
}

/**
 * Log in once and reuse the session: a Jurassic Ninja auto-login link only works once.
 *
 * @return {Promise<object>} Storage state.
 */
async function login() {
	if ( fs.existsSync( args.state ) ) {
		return JSON.parse( fs.readFileSync( args.state, 'utf8' ) );
	}
	const browser = await chromium.launch();
	const context = await browser.newContext();
	const page = await context.newPage();
	if ( process.env.WP_PASSWORD ) {
		await page.goto( `${ site }/wp-login.php`, { waitUntil: 'domcontentloaded' } );
		// Jetpack SSO hides the default form, so fill and submit it directly.
		await Promise.all( [
			page.waitForURL( /wp-admin/ ),
			page.evaluate(
				( [ user, pass ] ) => {
					document.querySelector( '#user_login' ).value = user;
					document.querySelector( '#user_pass' ).value = pass;
					document.querySelector( '#loginform' ).submit();
				},
				[ args.user, process.env.WP_PASSWORD ]
			),
		] );
	} else {
		await page.goto( `${ site }/?auto_login` );
		await page.goto( `${ site }/wp-admin/` );
	}
	if ( ! /wp-admin/.test( page.url() ) || page.url().includes( 'wp-login' ) ) {
		throw new Error( `Login failed, ended on ${ page.url() }` );
	}
	const state = await context.storageState( { path: args.state } );
	await browser.close();
	return state;
}

/**
 * Click a dashboard's sidebar link.
 *
 * @param {import('@playwright/test').Page} page      - Page.
 * @param {object}                          dashboard - Entry from DASHBOARDS.
 * @return {Promise<number|false>} Click time, or false when the link is missing.
 */
async function clickSidebar( page, dashboard ) {
	const selector = dashboard.pages.map( p => `#adminmenu a[href*="page=${ p }"]` ).join( ', ' );
	const link = page.locator( selector ).first();
	if ( ! ( await link.count() ) ) {
		return false;
	}
	await page.evaluate( () => globalThis.__navReset() );
	const clickedAt = Date.now();
	// A DOM click reaches links in collapsed submenus and under a page's open modal alike.
	await link.evaluate( a => a.click() );
	return clickedAt;
}

/**
 * One tour of every dashboard in a fresh browser.
 *
 * @param {string} browserName  - Browser name.
 * @param {object} browserType  - Playwright browser type.
 * @param {object} storageState - Logged-in session.
 * @param {number} run          - Run number.
 * @return {Promise<object[]>} One row per click.
 */
async function oneRun( browserName, browserType, storageState, run ) {
	const browser = await browserType.launch();
	const context = await browser.newContext( {
		storageState,
		viewport: { width: 1440, height: 900 },
	} );
	await context.addInitScript( recorder );
	const page = await context.newPage();
	let cdp = null;
	if ( browserName === 'chromium' ) {
		cdp = await context.newCDPSession( page );
		await cdp.send( 'HeapProfiler.enable' );
		if ( Number( args[ 'cpu-throttle' ] ) > 1 ) {
			await cdp.send( 'Emulation.setCPUThrottlingRate', {
				rate: Number( args[ 'cpu-throttle' ] ),
			} );
		}
	}
	const rows = [];
	const start = DASHBOARDS[ 0 ];
	await page.goto( `${ site }/wp-admin/admin.php?page=${ start.pages[ 0 ] }`, {
		waitUntil: 'load',
	} );
	await settle( page );
	// Idle time before the first click, so the shell's prewarm gets its chance.
	// eslint-disable-next-line playwright/no-wait-for-timeout -- Deliberate idle time.
	await page.waitForTimeout( Number( args.warmup ) );

	// Visit the start page last in each pass, so it is measured after a click like the others.
	const order = [ ...DASHBOARDS.slice( 1 ), start ];
	for ( let pass = 1; pass <= Number( args.passes ); pass++ ) {
		for ( const [ i, dashboard ] of order.entries() ) {
			const clickedAt = await clickSidebar( page, dashboard );
			if ( ! clickedAt ) {
				rows.push( {
					browser: browserName,
					run,
					pass,
					dashboard: dashboard.name,
					error: 'no sidebar link',
				} );
				console.log( JSON.stringify( rows.at( -1 ) ) );
				continue;
			}
			const s = await settle( page );
			rows.push( {
				browser: browserName,
				run,
				pass,
				dashboard: dashboard.name,
				url: page.url(),
				headerMs: s.header ? Math.round( s.header - clickedAt ) : null,
				interactiveMs: s.last ? Math.round( s.last - clickedAt ) : null,
				settled: s.settled,
				visited: ( pass - 1 ) * order.length + i + 1,
				heapMB: await heapMB( page, cdp ),
			} );
			console.log( JSON.stringify( rows.at( -1 ) ) );
		}
	}
	await browser.close();
	return rows;
}

const median = xs => {
	const s = xs.filter( x => typeof x === 'number' ).sort( ( a, b ) => a - b );
	if ( ! s.length ) {
		return null;
	}
	const m = Math.floor( s.length / 2 );
	return s.length % 2 ? s[ m ] : Math.round( ( s[ m - 1 ] + s[ m ] ) / 2 );
};

const all = [];
for ( const name of args.browsers.split( ',' ) ) {
	const storageState = await login();
	for ( let run = 1; run <= Number( args.runs ); run++ ) {
		all.push( ...( await oneRun( name, BROWSERS[ name ], storageState, run ) ) );
	}
}

const summary = [];
for ( const name of args.browsers.split( ',' ) ) {
	for ( let pass = 1; pass <= Number( args.passes ); pass++ ) {
		for ( const { name: dashboard } of DASHBOARDS ) {
			const rows = all.filter(
				r => r.browser === name && r.pass === pass && r.dashboard === dashboard
			);
			summary.push( {
				browser: name,
				pass,
				dashboard,
				n: rows.filter( r => ! r.error ).length,
				unsettled: rows.filter( r => r.settled === false ).length,
				headerMs: median( rows.map( r => r.headerMs ) ),
				interactiveMs: median( rows.map( r => r.interactiveMs ) ),
				heapMB: median( rows.map( r => r.heapMB ) ),
			} );
		}
	}
}

const file = path.join(
	args.out,
	`${ args.label }-${ new Date().toISOString().replace( /[:.]/g, '-' ) }.json`
);
fs.writeFileSync(
	file,
	JSON.stringify(
		{ site, label: args.label, args: { ...args, site }, summary, rows: all },
		null,
		'\t'
	)
);
console.table( summary );
console.log( `Wrote ${ file }` );
