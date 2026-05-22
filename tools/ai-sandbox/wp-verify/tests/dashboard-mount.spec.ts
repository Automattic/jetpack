/**
 * Dashboard mount checks — direct port of the legacy `check.cjs` behavior into
 * Playwright Test specs. Split into three independent tests so each failure mode
 * (JS exception / runaway height / collapsed chart) reports cleanly.
 */

import path from 'path';
import { test, expect } from '@playwright/test';

const ANALYTICS_URL = '/wp-admin/admin.php?page=jetpack-premium-analytics';
const ARTIFACT_DIR = process.env.PA_VERIFY_ARTIFACT_DIR || '/tmp/pa-verify';
const DASHBOARD_ROOT = '.jetpack-premium-analytics-dashboard';
const MAX_DASHBOARD_HEIGHT_PX = 10_000;

test.describe( 'Premium Analytics dashboard', () => {
	test( 'mounts without uncaught JS exceptions and renders heading', async ( { page } ) => {
		const pageErrors: string[] = [];
		page.on( 'pageerror', err => pageErrors.push( err.message ) );

		await page.goto( ANALYTICS_URL );

		// Wait for React to mount the dashboard root.
		await page.waitForSelector( DASHBOARD_ROOT, { timeout: 15_000 } );

		// Save a fresh screenshot before any assertion so the verify-ui skill can
		// commit it for the PR description (its Step 4 reads this path) — and so
		// failure states (wrong heading, JS errors) are still captured visually.
		await page.screenshot( {
			path: path.join( ARTIFACT_DIR, 'analytics-dashboard.png' ),
			fullPage: false,
		} );

		// Heading visible and correct.
		await expect( page.locator( `${ DASHBOARD_ROOT } h1` ) ).toHaveText( 'Analytics' );

		expect( pageErrors, `Uncaught JS exceptions detected:\n${ pageErrors.join( '\n' ) }` ).toEqual(
			[]
		);
	} );

	test( 'dashboard height stays bounded (no infinite resize)', async ( { page } ) => {
		await page.goto( ANALYTICS_URL );
		await page.waitForSelector( DASHBOARD_ROOT );

		const height = await page.$eval( DASHBOARD_ROOT, ( el: HTMLElement ) => el.scrollHeight );
		expect(
			height,
			`Dashboard height ${ height }px meets or exceeds the ${ MAX_DASHBOARD_HEIGHT_PX }px limit — possible infinite resize loop`
		).toBeLessThan( MAX_DASHBOARD_HEIGHT_PX );
	} );

	test( 'no SVG inside the dashboard renders at zero height', async ( { page } ) => {
		await page.goto( ANALYTICS_URL );
		await page.waitForSelector( DASHBOARD_ROOT );

		// Skip when no SVG is present (e.g. current clean-trunk state, before any
		// chart task has been implemented). The check is only meaningful once a
		// chart variant has been rendered into the dashboard.
		const initialCount = await page.$$eval(
			`${ DASHBOARD_ROOT } svg`,
			( els: Element[] ) => els.length
		);
		test.skip( initialCount === 0, 'No SVG elements present — no charts on the dashboard yet' );

		// Poll briefly so responsive charts have a chance to settle.
		await expect( async () => {
			const collapsed = await page.$$eval(
				`${ DASHBOARD_ROOT } svg`,
				( els: Element[] ) => els.filter( el => el.getBoundingClientRect().height === 0 ).length
			);
			expect( collapsed ).toBe( 0 );
		} ).toPass( { timeout: 2_000, intervals: [ 200, 200, 400, 400 ] } );
	} );
} );
