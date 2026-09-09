import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test, expect } from '@playwright/test';

const pluginRoot = fileURLToPath( new URL( '../../../../', import.meta.url ) );
let fixtureDirectory: string;

test.use( {
	viewport: { width: 1280, height: 900 },
	timezoneId: 'America/Los_Angeles',
	storageState: { cookies: [], origins: [] },
} );

// history-tooltip.webpack.cjs disables DependencyExtractionPlugin; CSS checks use bundled npm @wordpress/components and design tokens, not core copies.
test.beforeAll( async () => {
	test.setTimeout( 120000 );
	fixtureDirectory = await mkdtemp( path.join( tmpdir(), 'boost-history-tooltip-' ) );
	await promisify( execFile )(
		'pnpm',
		[
			'exec',
			'webpack',
			'--config',
			'tests/e2e/lib/fixtures/history-tooltip.webpack.cjs',
			'--output-path',
			fixtureDirectory,
		],
		{
			cwd: pluginRoot,
			maxBuffer: 10 * 1024 * 1024,
			env: { ...process.env, NPM_CONFIG_USERCONFIG: '/dev/null' },
		}
	);
} );

test.beforeEach( async ( { page } ) => {
	await page.clock.setFixedTime( new Date( '2026-09-09T12:00:00Z' ) );
	await page.route( 'http://boost-history.test/**', async route => {
		const filename = new URL( route.request().url() ).pathname.slice( 1 );
		if ( [ 'history-tooltip.js', 'history-tooltip.css' ].includes( filename ) ) {
			await route.fulfill( { path: path.join( fixtureDirectory, filename ) } );
		} else {
			await route.fulfill( {
				contentType: 'text/html',
				body: `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/history-tooltip.css"></head>
				<body style="margin: 100px 0"><div id="root"></div><script src="/history-tooltip.js"></script></body></html>`,
			} );
		}
	} );
	await page.goto( 'http://boost-history.test/' );
} );

test.afterAll( async () => {
	if ( fixtureDirectory ) {
		await rm( fixtureDirectory, { recursive: true, force: true } );
	}
} );

for ( const device of [ 'Desktop', 'Mobile' ] ) {
	test( `${ device } daily bars show recorded scores and matching tooltip dots`, async ( {
		page,
	} ) => {
		const chart = page.getByRole( 'region', { name: `${ device } score history` } );
		const bars = chart.locator( '.visx-bar' );
		await expect( bars ).toHaveCount( 30 );
		await expect( page.getByText( 'Aug 11 – Sep 9, 2026', { exact: true } ) ).toBeVisible();
		await expect( page.getByRole( 'button', { name: 'Next 30 days' } ) ).toBeDisabled();
		await bars.nth( 21 ).hover();
		const surface = page.locator( '.jetpack-boost-overview__history-tooltip' );
		await expect( surface ).toBeVisible();
		await expect( surface.locator( '.jetpack-boost-overview__tooltip-date' ) ).toHaveText(
			'September 1, 2026'
		);
		await expect( surface ).toContainText( 'Overall score' );
		const sections = surface.locator( '.jetpack-boost-overview__tooltip-section' );
		for ( const [ index, label, score, metrics ] of [
			[ 1, 'Desktop score', '80 / 100', [ '1.20s', '0.10s', '0.01' ] ],
			[ 2, 'Mobile score', '65 / 100', [ '2.10s', '0.30s', '0.04' ] ],
		] as const ) {
			const section = sections.nth( index );
			await expect( section.locator( 'dt' ).first() ).toHaveText( label );
			await expect( section.locator( 'dd' ) ).toHaveText( [ score, ...metrics ] );
			await expect( section.locator( 'dt' ) ).toHaveText( [
				label,
				'Largest Contentful Paint',
				'Total Blocking Time',
				'Cumulative Layout Shift',
			] );
			const dot = section.locator( '.jetpack-boost-overview__series-swatch' );
			const recordedBar = page
				.getByRole( 'region', { name: `${ index === 1 ? 'Desktop' : 'Mobile' } score history` } )
				.locator( '.visx-bar' )
				.nth( 21 );
			const fill = await recordedBar.evaluate( element => getComputedStyle( element ).fill );
			await expect( dot ).toHaveCSS( 'background-color', fill );
			const shape = await dot.evaluate( element => {
				const style = getComputedStyle( element );
				return {
					width: parseFloat( style.width ),
					height: parseFloat( style.height ),
					radius: parseFloat( style.borderRadius ),
				};
			} );
			expect( shape.width ).toBeGreaterThan( 0 );
			expect( shape.width ).toBe( shape.height );
			expect( shape.radius ).toBeGreaterThanOrEqual( shape.width / 2 );
		}
	} );

	test( `${ device } empty days and recorded tooltips work at narrow widths`, async ( { page } ) => {
		await page.setViewportSize( { width: 390, height: 900 } );
		const chart = page.getByRole( 'region', { name: `${ device } score history` } );
		const bars = chart.locator( '.visx-bar' );
		await expect( bars ).toHaveCount( 30 );
		await expect( bars.first() ).toHaveCSS( 'fill', 'none' );
		await expect( bars.first() ).not.toHaveCSS( 'stroke-dasharray', 'none' );
		const grid = chart.getByRole( 'grid' );
		await grid.focus();
		await page.keyboard.press( 'ArrowRight' );
		const surface = page.locator( '.jetpack-boost-overview__history-tooltip' );
		await expect( surface ).toContainText( 'August 11, 2026' );
		await expect( surface ).toContainText( 'No score recorded before you unlocked this feature.' );
		await page.keyboard.press( 'ArrowRight' );
		await expect( surface ).toContainText( 'August 12, 2026' );
		await page.keyboard.press( 'Escape' );
		await expect( surface ).toBeHidden();
		for ( const [ index, date ] of [
			[ 21, 'September 1, 2026' ],
			[ 27, 'September 7, 2026' ],
		] as const ) {
			await bars.nth( index ).hover();
			await expect( surface.locator( '.jetpack-boost-overview__tooltip-date' ) ).toHaveText( date );
			const popup = ( await surface.boundingBox() )!;
			expect( popup.x ).toBeGreaterThanOrEqual( 0 );
			expect( popup.x + popup.width ).toBeLessThanOrEqual( 390 );
		}
	} );
}

test( 'Hiding retained history removes a keyboard tooltip until another selection', async ( {
	page,
} ) => {
	const grid = page.getByRole( 'region', { name: 'Desktop score history' } ).getByRole( 'grid' );
	await grid.focus();
	await page.keyboard.press( 'ArrowRight' );
	await expect( page.getByRole( 'tooltip' ) ).toBeVisible();
	await page.getByRole( 'button', { name: 'Toggle history' } ).click();
	await expect( page.getByRole( 'tooltip' ) ).toHaveCount( 0 );
	await page.getByRole( 'button', { name: 'Toggle history' } ).click();
	await expect( page.getByRole( 'tooltip' ) ).toHaveCount( 0 );
	await grid.focus();
	await page.keyboard.press( 'ArrowRight' );
	await expect( page.getByRole( 'tooltip' ) ).toBeVisible();
} );

test( 'Score cards show the tier palette, baseline delta colors, and responsive dividers', async ( {
	page,
} ) => {
	await page.goto( 'http://boost-history.test/?scores' );
	const desktop = page.getByRole( 'region', { name: 'Desktop', exact: true } );
	const mobile = page.getByRole( 'region', { name: 'Mobile', exact: true } ).first();
	const overall = page.getByRole( 'region', { name: 'Overall grade', exact: true } );
	await expect( desktop.first().getByText( 'Good', { exact: true } ) ).toBeVisible();
	await expect( mobile.getByText( 'Could be improved', { exact: true } ) ).toBeVisible();
	await expect( desktop.nth( 1 ).getByText( 'Poor', { exact: true } ) ).toBeVisible();
	await expect( overall.getByText( /Good|Could be improved|Poor/ ) ).toHaveCount( 0 );
	for ( const [ card, score, color ] of [
		[ desktop.first(), 90, 'color(srgb 0 0.501961 0.188235 / 0.9)' ],
		[ mobile, 60, 'color(srgb 0.572549 0.388235 0 / 0.9)' ],
		[ desktop.nth( 1 ), 40, 'color(srgb 0.8 0.0941176 0.0941176 / 0.9)' ],
	] as const ) {
		await expect( card.getByRole( 'progressbar' ) ).toHaveJSProperty( 'value', score );
		await expect( card.getByRole( 'progressbar' ) ).toHaveAttribute( 'max', '100' );
		const track = card.locator( '.jetpack-boost-overview__progress' );
		await expect( track.locator( ':scope > div' ) ).toHaveCSS( 'background-color', color );
		await expect( track ).toHaveCSS( 'height', '4px' );
		await expect( track ).toHaveCSS( 'border-radius', '4px' );
	}
	await expect( desktop.first().getByText( '+10 points compared with Boost disabled' ) ).toHaveCSS(
		'color',
		'rgb(0, 128, 48)'
	);
	await expect( mobile.getByText( /compared with Boost disabled/ ) ).toHaveCount( 0 );
	await expect( desktop.first() ).toHaveCSS( 'padding-top', '16px' );
	await expect( desktop.first() ).toHaveCSS( 'padding-bottom', '16px' );
	await expect( desktop.first() ).toHaveCSS( 'padding-left', '20px' );
	await expect( desktop.first() ).toHaveCSS( 'padding-right', '20px' );
	await expect( desktop.first() ).toHaveCSS( 'gap', '8px' );
	await expect( page.locator( '.jetpack-boost-overview__scores-header' ).first() ).toHaveCSS(
		'height',
		'64px'
	);
	const headerDivider = page.locator( '.jetpack-boost-overview__scores-divider' ).first();
	await expect( headerDivider ).toBeVisible();
	await expect( headerDivider ).toHaveCSS( 'border-bottom-width', '1px' );
	await expect( headerDivider ).toHaveCSS( 'border-bottom-style', 'solid' );
	await expect( headerDivider ).toHaveCSS( 'border-bottom-color', 'rgb(219, 219, 219)' );
	await expect( desktop.first() ).toHaveCSS( 'border-left-width', '1px' );
	await expect( desktop.first() ).toHaveCSS( 'border-left-style', 'solid' );
	await expect( desktop.first() ).toHaveCSS( 'border-left-color', 'rgb(219, 219, 219)' );
	await page.setViewportSize( { width: 390, height: 900 } );
	await expect( desktop.first() ).toHaveCSS( 'border-left-width', '0px' );
	await expect( desktop.first() ).toHaveCSS( 'border-top-width', '1px' );
	await expect( desktop.first() ).toHaveCSS( 'border-top-style', 'solid' );
	await expect( desktop.first() ).toHaveCSS( 'border-top-color', 'rgb(219, 219, 219)' );
} );

test.describe( 'Overall grade help', () => {
	test.use( { hasTouch: true } );

	test( 'opens on hover, keyboard activation, and touch', async ( { page } ) => {
		await page.goto( 'http://boost-history.test/?scores' );
		const trigger = page
			.getByRole( 'button', { name: 'How the overall grade is calculated' } )
			.first();
		const popup = page.getByRole( 'dialog', { name: 'Overall grade' } );
		await trigger.hover();
		await expect( popup ).toBeVisible();
		await expect( trigger ).toHaveCSS( 'background-color', 'rgba(0, 0, 0, 0)' );
		await expect( trigger ).toHaveCSS( 'background-image', 'none' );
		await expect( popup ).toContainText( 'across both mobile and desktop devices' );
		await page.mouse.move( 0, 0 );
		await expect( popup ).toBeHidden();
		await trigger.focus();
		await trigger.press( 'Enter' );
		await expect( popup ).toBeVisible();
		await page.keyboard.press( 'Escape' );
		await expect( popup ).toBeHidden();
		await expect( trigger ).toBeFocused();
		await page.setViewportSize( { width: 390, height: 900 } );
		await trigger.tap();
		await expect( popup ).toBeVisible();
	} );
} );
