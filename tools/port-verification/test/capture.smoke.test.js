/**
 * Browser-backed smoke test for src/capture.js against test/stub-wp-admin.js. Skipped when
 * no Chromium is installed (`pnpm exec playwright install chromium`), so `pnpm test` stays
 * browser-free; run it with `pnpm test:smoke`.
 */

import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { capturePage } from '../src/capture.js';
import { diffSnapshots } from '../src/diff.js';
import { startStub } from './stub-wp-admin.js';

const CREDENTIALS = { username: 'admin', password: 'password' };

const hasBrowser = await ( async () => {
	try {
		const { chromium } = await import( 'playwright' );
		const browser = await chromium.launch( { headless: true } );
		await browser.close();
		return true;
	} catch {
		return false;
	}
} )();

describe(
	'capturePage against a wp-admin stub',
	{ skip: hasBrowser ? false : 'no Chromium installed' },
	() => {
		let stub;

		before( async () => {
			stub = await startStub();
		} );
		after( async () => {
			await stub.close();
		} );

		it( 'logs in and captures the target page, not the Dashboard', async () => {
			const snapshot = await capturePage( {
				...CREDENTIALS,
				url: `${ stub.url }/wp-admin/admin.php?page=jetpack`,
				loadState: 'load',
			} );
			assert.equal( snapshot.meta.url, `${ stub.url }/wp-admin/admin.php?page=jetpack` );
			assert.ok( snapshot.geometry.root, '#wpwrap was measured' );
			assert.ok( snapshot.geometry.header, '#wpadminbar was measured' );
		} );

		it( 'drops the login and Dashboard traffic from the snapshot', async () => {
			const snapshot = await capturePage( {
				...CREDENTIALS,
				url: `${ stub.url }/wp-admin/admin.php?page=jetpack`,
				loadState: 'load',
			} );
			const paths = snapshot.network.map( r => new URL( r.url ).pathname );
			assert.ok( paths.includes( '/common.js' ), 'kept the target page request' );
			assert.ok( ! paths.includes( '/dashboard-only.js' ), 'dropped the Dashboard request' );
			assert.ok( ! paths.includes( '/wp-login.php' ), 'dropped the login request' );
		} );

		it( 'reports an element hidden by an ancestor as hidden, not as a zero rect', async () => {
			const snapshot = await capturePage( {
				...CREDENTIALS,
				url: `${ stub.url }/wp-admin/admin.php?page=jetpack&flag=on`,
				controlSelector: '.only-real-button',
				loadState: 'load',
			} );
			assert.equal( snapshot.geometry.footer.hidden, true, '#wpfooter is display:none' );
			assert.equal( snapshot.geometry.control.hidden, false );
			assert.equal( snapshot.geometry.control.matchCount, 1 );
		} );

		it( 'counts every element a control selector matches', async () => {
			const snapshot = await capturePage( {
				...CREDENTIALS,
				url: `${ stub.url }/wp-admin/admin.php?page=jetpack`,
				controlSelector: '.components-button',
				loadState: 'load',
			} );
			assert.equal( snapshot.geometry.control.matchCount, 2 );
			// The first match is inside a display:none wrapper, which a computed style on the
			// element alone would miss.
			assert.equal( snapshot.geometry.control.hidden, true );
		} );

		it( 'records a request that never gets a response', async () => {
			const snapshot = await capturePage( {
				...CREDENTIALS,
				url: `${ stub.url }/wp-admin/admin.php?page=jetpack&flag=on`,
				loadState: 'load',
			} );
			const missing = snapshot.network.find( r => r.url.endsWith( '/boot.js' ) );
			assert.ok( missing, 'boot.js appears in the snapshot' );
		} );

		it( 'marks the control required once a selector is given', async () => {
			const snapshot = await capturePage( {
				...CREDENTIALS,
				url: `${ stub.url }/wp-admin/admin.php?page=jetpack`,
				controlSelector: '.only-real-button',
				loadState: 'load',
			} );
			assert.equal( snapshot.meta.targets.control.required, true );
			assert.equal( snapshot.meta.targets.control.selector, '.only-real-button' );
		} );

		it( 'refuses to capture wp-login.php when no credentials are given', async () => {
			await assert.rejects(
				capturePage( { url: `${ stub.url }/wp-admin/admin.php?page=jetpack`, loadState: 'load' } ),
				/wp-login\.php/
			);
		} );

		it( 'refuses to capture a page a redirect moved it away from', async () => {
			await assert.rejects(
				capturePage( { ...CREDENTIALS, url: `${ stub.url }/elsewhere`, loadState: 'load' } ),
				/a redirect moved the capture/
			);
		} );

		it( 'follows an autologin URL instead of the login form', async () => {
			const snapshot = await capturePage( {
				url: `${ stub.url }/wp-admin/admin.php?page=jetpack`,
				autologinUrl: `${ stub.url }/auto-login`,
				loadState: 'load',
			} );
			assert.ok( snapshot.geometry.root );
		} );

		it( 'fails the flag-off capture when the flag-on marker is already present', async () => {
			await assert.rejects(
				capturePage( {
					...CREDENTIALS,
					url: `${ stub.url }/wp-admin/admin.php?page=jetpack&flag=on`,
					absentSelector: '#boot-mount',
					loadState: 'load',
				} ),
				/did the flag really change/
			);
		} );

		it( 'diffs two real captures into the accepted inset and nothing else', async () => {
			const shared = { ...CREDENTIALS, controlSelector: '.only-real-button', loadState: 'load' };
			const off = await capturePage( {
				...shared,
				url: `${ stub.url }/wp-admin/admin.php?page=jetpack`,
			} );
			const on = await capturePage( {
				...shared,
				url: `${ stub.url }/wp-admin/admin.php?page=jetpack&flag=on`,
			} );
			const { geometry, network } = diffSnapshots( off, on );

			const root = geometry.find( g => g.key === 'root' );
			assert.equal( root.status, 'changed' );
			// The stub's body has a default margin, so assert the 8px shift, not absolute x.
			assert.match( root.details.join( ' ' ), /x: \d+px -> \d+px \(Δ8\.0px\)/ );

			const footer = geometry.find( g => g.key === 'footer' );
			assert.equal( footer.status, 'hidden-changed' );

			assert.equal( geometry.find( g => g.key === 'header' ).status, 'ok' );

			const bootJs = network.onlyAfter.find( r => r.url.endsWith( '/boot.js' ) );
			assert.ok( bootJs, 'boot.js fires only with the flag on' );
		} );
	}
);
