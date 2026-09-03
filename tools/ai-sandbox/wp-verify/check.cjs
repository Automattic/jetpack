// DEPRECATED — superseded by the Playwright Test suite under ./tests/.
// Kept temporarily as a fallback while the new runner stabilizes; the
// `/premium-analytics-verify-ui` skill now invokes `playwright test` against
// ./playwright.config.ts. Remove this file once the new runner has been used
// on the next two verify-ui rounds without regression.
//
// CommonJS so NODE_PATH is honoured when resolving the globally-installed playwright package.
// Wrapped in an async IIFE because top-level await is not valid in CommonJS.

const fs = require( 'fs' );
const path = require( 'path' );
const { chromium } = require( 'playwright' );

( async () => {
	const WP_BASE = process.env.WP_BASE || 'http://wordpress';
	const ANALYTICS_URL = `${ WP_BASE }/wp-admin/admin.php?page=jetpack-premium-analytics`;
	// Honour PA_VERIFY_ARTIFACT_DIR (used by the Playwright runner + docs) first
	// so artifacts land in the same directory regardless of which runner is
	// invoked; SCREENSHOT_DIR is kept as a legacy alias for older skill invocations.
	const SCREENSHOT_DIR =
		process.env.PA_VERIFY_ARTIFACT_DIR || process.env.SCREENSHOT_DIR || '/tmp/pa-verify';
	const SCREENSHOT_PATH = path.join( SCREENSHOT_DIR, 'analytics-dashboard.png' );

	fs.mkdirSync( SCREENSHOT_DIR, { recursive: true } );

	let browser;
	try {
		browser = await chromium.launch( { args: [ '--no-sandbox', '--disable-setuid-sandbox' ] } );
		const page = await browser.newPage();
		const pageErrors = [];

		// Only capture JS runtime exceptions — not HTTP-level console.error noise
		// (e.g. Gutenberg background API calls that 404 in the minimal test environment).
		page.on( 'pageerror', err => pageErrors.push( err.message ) );
		// Login
		await page.goto( `${ WP_BASE }/wp-login.php` );
		await page.fill( '#user_login', 'admin' );
		await page.fill( '#user_pass', 'password' );
		await page.click( '#wp-submit' );
		await page.waitForURL( '**/wp-admin/**' );

		// Navigate to Analytics
		await page.goto( ANALYTICS_URL );

		// Wait for React to mount
		await page
			.waitForSelector( '.jetpack-premium-analytics-dashboard', { timeout: 15000 } )
			.catch( () => {
				throw new Error( 'Dashboard root not found — React may not have mounted' );
			} );

		// Assert the dashboard heading rendered
		const heading = await page
			.$eval( '.jetpack-premium-analytics-dashboard h1', el => el.textContent.trim() )
			.catch( () => {
				throw new Error( 'Dashboard h1 not found — React may not have rendered' );
			} );
		if ( heading !== 'Analytics' ) {
			throw new Error( `Unexpected dashboard heading: "${ heading }"` );
		}

		await page.screenshot( { path: SCREENSHOT_PATH, fullPage: false } );

		if ( pageErrors.length ) {
			throw new Error( 'Uncaught JS exceptions detected:\n' + pageErrors.join( '\n' ) );
		}

		// Generic health: dashboard element must not grow beyond a reasonable height.
		// Scoped to the dashboard root to avoid false positives from wp-admin chrome
		// (notices, help panels, etc.). An abnormally tall dashboard (>10 000 px) indicates
		// an infinite resize loop inside the analytics UI.
		const dashboardHeight = await page.$eval(
			'.jetpack-premium-analytics-dashboard',
			el => el.scrollHeight
		);
		if ( dashboardHeight > 10000 ) {
			throw new Error(
				`Dashboard height ${ dashboardHeight }px exceeds limit — possible infinite resize loop`
			);
		}

		// Generic health: no SVG inside the dashboard should have zero height after render.
		// Two-phase approach:
		//   Phase 1 — quick snapshot: if SVGs are already present, skip the async-wait
		//             so the no-charts case (current trunk) exits immediately.
		//   Phase 2 — poll up to 2 s only when SVGs exist, letting responsive charts
		//             settle before declaring a zero-height SVG a failure.
		const POLL_INTERVAL = 200;
		const POLL_TIMEOUT = 2000;
		const svgSnapshot = await page.$$eval(
			'.jetpack-premium-analytics-dashboard svg',
			els => els.length
		);
		if ( svgSnapshot > 0 ) {
			let collapsedSvgs = svgSnapshot;
			const deadline = Date.now() + POLL_TIMEOUT;
			do {
				collapsedSvgs = await page.$$eval(
					'.jetpack-premium-analytics-dashboard svg',
					els => els.filter( el => el.getBoundingClientRect().height === 0 ).length
				);
				if ( collapsedSvgs === 0 ) break;
				await new Promise( resolve => setTimeout( resolve, POLL_INTERVAL ) );
			} while ( Date.now() < deadline );
			if ( collapsedSvgs > 0 ) {
				throw new Error(
					`${ collapsedSvgs } SVG(s) in dashboard have zero height — charts may not have rendered`
				);
			}
		}

		console.log( '✓ Analytics dashboard mounted without uncaught JS exceptions' );
		console.log( `  dashboard height: ${ dashboardHeight }px` );
		console.log( `Screenshot saved to ${ SCREENSHOT_PATH }` );
	} finally {
		await browser?.close();
	}
} )();
