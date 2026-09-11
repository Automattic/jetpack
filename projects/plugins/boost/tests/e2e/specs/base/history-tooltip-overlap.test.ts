import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test, expect, type Locator } from '@playwright/test';

const pluginRoot = fileURLToPath( new URL( '../../../../', import.meta.url ) );
let fixtureDirectory: string;

/**
 * Hover a day through the chart's pointer-capture layer.
 *
 * @param chart - Chart region.
 * @param index - Zero-based day index.
 */
async function hoverDay( chart: Locator, index: number ) {
	const capture = chart.locator( 'svg > rect[fill="transparent"]' );
	await capture.scrollIntoViewIfNeeded();
	const captureBox = ( await capture.boundingBox() )!;
	const barBox = ( await chart.locator( '.visx-bar' ).nth( index ).boundingBox() )!;
	await capture.hover( {
		position: {
			x: barBox.x + barBox.width / 2 - captureBox.x,
			y: captureBox.height / 2,
		},
	} );
}

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
		await hoverDay( chart, 21 );
		const surface = page.locator( '.jetpack-boost-overview__history-tooltip' );
		await expect( surface ).toBeVisible();
		await expect( surface ).toHaveCSS( 'background-color', /^rgb\(/ );
		const coveredBars = await surface.evaluate( element => {
			// Include the non-interactive tooltip in browser paint-order hit testing.
			const surfaceElement = element as HTMLElement;
			surfaceElement.style.pointerEvents = 'auto';
			const popup = element.getBoundingClientRect();
			const overlaps = Array.from( document.querySelectorAll( '.visx-bar' ) ).flatMap( bar => {
				const rect = bar.getBoundingClientRect();
				const left = Math.max( popup.left, rect.left );
				const right = Math.min( popup.right, rect.right );
				const top = Math.max( popup.top, rect.top );
				const bottom = Math.min( popup.bottom, rect.bottom );
				if ( left >= right || top >= bottom ) {
					return [];
				}
				const painted = document.elementFromPoint( ( left + right ) / 2, ( top + bottom ) / 2 );
				return [ element.contains( painted ) ];
			} );
			surfaceElement.style.removeProperty( 'pointer-events' );
			return overlaps;
		} );
		expect( coveredBars.length ).toBeGreaterThan( 0 );
		expect( coveredBars.every( covered => covered ) ).toBe( true );
		await expect( surface.locator( '.jetpack-boost-overview__tooltip-date' ) ).toHaveText(
			'September 1, 2026'
		);
		await expect( surface ).toContainText( 'Overall score' );
		await expect( surface ).toHaveCSS( 'width', '265px' );
		await expect( surface ).toHaveCSS( 'height', '382px' );
		await expect( surface ).toHaveCSS( 'padding', '17px' );
		const popupBox = ( await surface.boundingBox() )!;
		const hoveredBar = ( await bars.nth( 21 ).boundingBox() )!;
		const cardBox = ( await page
			.getByText( 'Last 30 days scores', { exact: true } )
			.boundingBox() )!;
		expect(
			popupBox.x >= Math.floor( hoveredBar.x + hoveredBar.width ) ||
				popupBox.x + popupBox.width <= Math.ceil( hoveredBar.x )
		).toBe( true );
		const chartBounds = ( await chart.boundingBox() )!;
		expect( popupBox.x ).toBeGreaterThanOrEqual( chartBounds.x );
		expect( popupBox.x + popupBox.width ).toBeLessThanOrEqual( chartBounds.x + chartBounds.width );
		expect( popupBox.y ).toBeLessThan( cardBox.y + cardBox.height );
		await expect( surface.locator( '.jetpack-boost-overview__tooltip-date' ) ).toHaveCSS(
			'font-weight',
			'400'
		);
		const sections = surface.locator( '.jetpack-boost-overview__tooltip-section' );
		for ( const [ index, label, score, metrics ] of [
			[ 1, 'Desktop', '80/100', [ '1.20s', '0.10s', '0.01' ] ],
			[ 2, 'Mobile', '65/100', [ '2.10s', '0.30s', '0.04' ] ],
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
			expect( shape.width ).toBe( 8 );
			expect( shape.height ).toBe( 8 );
			const dotPosition = await dot.evaluate( element => {
				const labelElement = element.parentElement!;
				const range = document.createRange();
				range.selectNodeContents( labelElement.firstChild! );
				return element.getBoundingClientRect().left - range.getBoundingClientRect().right;
			} );
			expect( dotPosition ).toBeCloseTo( 8, 0 );
			const values = await section
				.locator( 'dd' )
				.evaluateAll( elements =>
					elements.map( element => element.getBoundingClientRect().right )
				);
			expect( Math.max( ...values ) - Math.min( ...values ) ).toBeLessThan( 1 );
			expect( shape.radius ).toBeGreaterThanOrEqual( shape.width / 2 );
		}
	} );

	test( `${ device } empty days and recorded tooltips work at narrow widths`, async ( {
		page,
	} ) => {
		await page.setViewportSize( { width: 390, height: 900 } );
		const chart = page.getByRole( 'region', { name: `${ device } score history` } );
		const bars = chart.locator( '.visx-bar' );
		await expect( bars ).toHaveCount( 15 );
		await expect( bars.first() ).toHaveCSS( 'fill', 'rgb(224, 224, 224)' );
		await expect( bars.first() ).toHaveCSS( 'height', '4px' );
		await expect( bars.first() ).toHaveCSS( 'stroke-dasharray', 'none' );
		const grid = chart.getByRole( 'grid' );
		await grid.focus();
		await page.keyboard.press( 'ArrowRight' );
		const surface = page.locator( '.jetpack-boost-overview__history-tooltip' );
		await expect( surface ).toContainText( 'August 26, 2026' );
		await expect( surface ).toHaveCSS( 'background-color', /^rgb\(/ );
		await expect( surface ).toContainText( 'No scores recorded before feature was unlocked' );
		await page.keyboard.press( 'ArrowRight' );
		await expect( surface ).toContainText( 'August 27, 2026' );
		await page.keyboard.press( 'Escape' );
		await expect( surface ).toBeHidden();
		for ( const [ index, date ] of [
			[ 6, 'September 1, 2026' ],
			[ 12, 'September 7, 2026' ],
		] as const ) {
			await hoverDay( chart, index );
			await expect( surface.locator( '.jetpack-boost-overview__tooltip-date' ) ).toHaveText( date );

			const popup = ( await surface.boundingBox() )!;
			expect( popup.x ).toBeGreaterThanOrEqual( 0 );
			expect( popup.x + popup.width ).toBeLessThanOrEqual( 390 );
		}
		const zeroBar = bars.nth( 12 );
		await expect( zeroBar ).toHaveAttribute( 'fill', 'var(--jetpack-boost-score-poor)' );
		await expect( zeroBar ).not.toHaveCSS( 'fill', 'none' );
		expect( ( await zeroBar.boundingBox() )!.height ).toBeGreaterThan( 0 );
		await expect( surface ).toContainText( '0/100' );
		const flippedPopup = ( await surface.boundingBox() )!;
		const rightmostBar = ( await zeroBar.boundingBox() )!;
		expect( flippedPopup.x + flippedPopup.width ).toBeLessThan( rightmostBar.x );
	} );
}

test( 'uses compact plots with three horizontal gridlines and no band legend', async ( {
	page,
} ) => {
	await expect( page.getByText( 'Could be improved', { exact: true } ) ).toHaveCount( 0 );
	for ( const device of [ 'Desktop', 'Mobile' ] ) {
		const chart = page.getByRole( 'region', { name: `${ device } score history` } );
		await expect( chart.locator( '.visx-rows line' ) ).toHaveCount( 3 );
		await expect( chart.getByLabel( 'XYChart' ) ).toHaveCSS( 'height', '96px' );
	}

	const desktop = page.getByRole( 'region', { name: 'Desktop score history' } );
	const mobile = page.getByRole( 'region', { name: 'Mobile score history' } );
	await hoverDay( desktop, 0 );
	const highlight = page.locator( '.boost-daily-history__highlight' );
	await expect( highlight ).toHaveCount( 1 );
	await expect( highlight ).toBeVisible();
	const band = ( await highlight.boundingBox() )!;
	const firstPanel = ( await desktop.boundingBox() )!;
	const secondSvg = ( await mobile.getByLabel( 'XYChart' ).boundingBox() )!;
	const bar = ( await desktop.locator( '.visx-bar' ).first().boundingBox() )!;
	expect( band.y ).toBeCloseTo( firstPanel.y, 0 );
	expect( band.y + band.height ).toBeCloseTo( secondSvg.y + secondSvg.height - 24, 0 );
	expect( band.width ).toBeCloseTo( bar.width + 1, 0 );
	const tooltip = page.locator( '.jetpack-boost-overview__history-tooltip' );
	await expect( tooltip ).toContainText( 'No scores recorded before feature was unlocked' );
	await expect( tooltip ).toHaveCSS( 'width', '265px' );
	await expect( tooltip ).toHaveCSS( 'height', '106px' );
	const emptyPopup = ( await tooltip.boundingBox() )!;
	expect( emptyPopup.y ).toBeGreaterThanOrEqual( firstPanel.y );
	expect( emptyPopup.y + emptyPopup.height ).toBeLessThanOrEqual( secondSvg.y + secondSvg.height );
	await expect( tooltip.locator( '.jetpack-boost-overview__tooltip-date' ) ).toHaveCSS(
		'font-weight',
		'600'
	);
} );

test( 'an all-zero window paints recorded scores separately from empty slots', async ( {
	page,
} ) => {
	await page.goto( 'http://boost-history.test/?zeros' );
	for ( const device of [ 'Desktop', 'Mobile' ] ) {
		const chart = page.getByRole( 'region', { name: `${ device } score history` } );
		const bars = chart.locator( '.visx-bar' );
		const zeroBar = bars.nth( 21 );
		await expect( zeroBar ).toHaveAttribute( 'fill', 'var(--jetpack-boost-score-poor)' );
		await expect( zeroBar ).not.toHaveCSS( 'fill', 'none' );
		expect( ( await zeroBar.boundingBox() )!.height ).toBeGreaterThan( 0 );
		await expect( bars.first() ).toHaveCSS( 'fill', 'rgb(224, 224, 224)' );
		await expect( bars.first() ).toHaveCSS( 'height', '4px' );
		await expect( bars.first() ).toHaveCSS( 'stroke-dasharray', 'none' );
	}
} );

test( 'Tabbing between daily charts preserves focus and resets the previous tooltip', async ( {
	page,
} ) => {
	const desktop = page.getByRole( 'region', { name: 'Desktop score history' } ).getByRole( 'grid' );
	const mobile = page.getByRole( 'region', { name: 'Mobile score history' } ).getByRole( 'grid' );
	const tooltip = page.getByRole( 'tooltip' );
	await desktop.focus();
	await page.keyboard.press( 'ArrowRight' );
	await expect( tooltip ).toContainText( 'August 11, 2026' );
	await page.keyboard.press( 'ArrowRight' );
	await expect( tooltip ).toContainText( 'August 12, 2026' );
	await page.keyboard.press( 'Tab' );
	await expect( mobile ).toBeFocused();
	await expect( tooltip ).toHaveCount( 0 );
	await page.keyboard.press( 'ArrowRight' );
	await expect( tooltip ).toContainText( 'August 11, 2026' );
	await page.keyboard.press( 'Shift+Tab' );
	await expect( desktop ).toBeFocused();
	await expect( tooltip ).toHaveCount( 0 );
	await page.keyboard.press( 'ArrowRight' );
	await expect( tooltip ).toContainText( 'August 11, 2026' );
} );

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

test( 'switches at the narrow breakpoint and pages by the visible number of days', async ( {
	page,
} ) => {
	const bars = page.getByRole( 'region', { name: 'Desktop score history' } ).locator( '.visx-bar' );
	await page.setViewportSize( { width: 601, height: 900 } );
	await expect( bars ).toHaveCount( 30 );
	await page.getByRole( 'button', { name: 'Previous 30 days' } ).click();
	await expect( page.getByText( 'Jul 12 – Aug 10, 2026', { exact: true } ) ).toBeVisible();
	await page.setViewportSize( { width: 600, height: 900 } );
	await expect( bars ).toHaveCount( 15 );
	await expect( page.getByText( 'Aug 26 – Sep 9, 2026', { exact: true } ) ).toBeVisible();
	await expect( page.getByRole( 'button', { name: 'Next 15 days' } ) ).toBeDisabled();
	await page.getByRole( 'button', { name: 'Previous 15 days' } ).click();
	await expect( page.getByText( 'Aug 11 – Aug 25, 2026', { exact: true } ) ).toBeVisible();
	await page.getByRole( 'button', { name: 'Next 15 days' } ).click();
	await expect( page.getByText( 'Aug 26 – Sep 9, 2026', { exact: true } ) ).toBeVisible();
	await page.setViewportSize( { width: 601, height: 900 } );
	await expect( bars ).toHaveCount( 30 );
	await expect( page.getByText( 'Aug 11 – Sep 9, 2026', { exact: true } ) ).toBeVisible();
} );
