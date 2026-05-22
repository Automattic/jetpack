/**
 * Global setup for premium-analytics UI verification.
 *
 * Runs once before any spec — logs in to wp-admin and saves the cookie/localStorage state
 * to disk. Each test then loads that state via the `storageState` option in the config,
 * skipping the login flow per-test.
 *
 * Also polls wp-login.php until WordPress responds, giving the caller flexibility to kick
 * off this runner immediately after `wp-verify.sh up` without waiting separately.
 */

import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

const WP_BASE = process.env.WP_BASE || 'http://wordpress';
const ARTIFACT_DIR = process.env.PA_VERIFY_ARTIFACT_DIR || '/tmp/pa-verify';
const AUTH_FILE = path.join( ARTIFACT_DIR, 'auth.json' );
const READINESS_TIMEOUT_MS = 60_000;
const PER_REQUEST_TIMEOUT_MS = 3_000;

/**
 * Poll wp-login.php until WordPress responds 2xx or the deadline elapses. Each
 * `fetch` is bounded by `PER_REQUEST_TIMEOUT_MS` via AbortSignal so a hung TCP
 * connection cannot stall past the overall readiness deadline.
 */
async function waitForWordPress(): Promise< void > {
	const deadline = Date.now() + READINESS_TIMEOUT_MS;
	let lastErr: unknown;
	while ( Date.now() < deadline ) {
		try {
			const res = await fetch( `${ WP_BASE }/wp-login.php`, {
				signal: AbortSignal.timeout( PER_REQUEST_TIMEOUT_MS ),
			} );
			// Cancel the body so undici returns the connection to the pool — otherwise
			// repeated polling can accumulate stuck sockets.
			await res.body?.cancel();
			if ( res.ok ) return;
			lastErr = new Error( `wp-login.php returned ${ res.status }` );
		} catch ( err ) {
			lastErr = err;
		}
		await new Promise( resolve => setTimeout( resolve, 1000 ) );
	}
	throw new Error(
		`WordPress at ${ WP_BASE } was not reachable within ${ READINESS_TIMEOUT_MS }ms: ${ String(
			lastErr
		) }`
	);
}

/**
 * Playwright global-setup entry: wait for WP, then save an authenticated storageState
 * that every spec inherits via the config's `use.storageState`.
 */
export default async function globalSetup(): Promise< void > {
	fs.mkdirSync( ARTIFACT_DIR, { recursive: true } );

	await waitForWordPress();

	const browser = await chromium.launch( {
		args: [ '--no-sandbox', '--disable-setuid-sandbox' ],
	} );
	try {
		const context = await browser.newContext();
		const page = await context.newPage();
		await page.goto( `${ WP_BASE }/wp-login.php` );
		await page.fill( '#user_login', 'admin' );
		await page.fill( '#user_pass', 'password' );
		await page.click( '#wp-submit' );
		await page.waitForURL( '**/wp-admin/**' );
		await context.storageState( { path: AUTH_FILE } );
	} finally {
		await browser.close();
	}
}
