import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test, expect, type Locator, type Page } from '@playwright/test';

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

/**
 * Assert the day details stay in view, clear of the highlighted day, card header and chevrons.
 *
 * @param page  - Fixture page.
 * @param popup - Day details surface.
 * @return Bounding boxes of the day details and the highlighted day.
 */
async function expectClearOfCard( page: Page, popup: Locator ) {
	await expect( popup ).toBeInViewport( { ratio: 1 } );
	const popupBox = ( await popup.boundingBox() )!;
	const band = ( await page.locator( '.boost-daily-history__highlight' ).boundingBox() )!;
	const controls = [
		page.locator( '.boost-daily-history__card-header' ),
		...( await page.getByRole( 'button', { name: /^(Previous|Next) \d+ days$/ } ).all() ),
	];
	expect( controls ).toHaveLength( 3 );
	for ( const box of [ band, ...( await Promise.all( controls.map( c => c.boundingBox() ) ) ) ] ) {
		expect(
			popupBox.x >= Math.floor( box!.x + box!.width ) ||
				popupBox.x + popupBox.width <= Math.ceil( box!.x ) ||
				popupBox.y >= box!.y + box!.height ||
				popupBox.y + popupBox.height <= box!.y
		).toBe( true );
	}
	return { popupBox, band };
}

/**
 * Assert the day details sit beside the highlighted day, aligned to the top of its band.
 *
 * @param page  - Fixture page.
 * @param popup - Day details surface.
 * @return Bounding box of the day details.
 */
async function expectBesideDay( page: Page, popup: Locator ) {
	const { popupBox, band } = await expectClearOfCard( page, popup );
	expect(
		popupBox.x >= Math.floor( band.x + band.width ) ||
			popupBox.x + popupBox.width <= Math.ceil( band.x )
	).toBe( true );
	expect( popupBox.y ).toBeCloseTo( band.y, 0 );
	return popupBox;
}

/**
 * Resolve the empty-day token in the browser.
 *
 * @param page - Fixture page.
 * @return Computed empty-day color.
 */
function getEmptyDayColor( page: Page ) {
	return page.evaluate( () => {
		const swatch = document.createElement( 'span' );
		swatch.style.color = 'var(--wpds-color-stroke-surface-neutral)';
		document.body.append( swatch );
		const color = getComputedStyle( swatch ).color;
		swatch.remove();
		return color;
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
		const popover = page.locator( '.boost-daily-history__popover' );
		const surface = popover.locator( '.jetpack-boost-overview__history-tooltip' );
		await expect( surface ).toBeVisible();
		await expect( surface.locator( '.jetpack-boost-overview__tooltip-date' ) ).toHaveText(
			'September 1, 2026'
		);
		await expect( surface ).toHaveCSS( 'background-color', /^rgb\(/ );
		await expect( surface ).toContainText( 'Overall score' );
		await expect( surface ).toHaveCSS( 'width', '265px' );
		await expect( surface ).toHaveCSS( 'height', '366px' );
		await expect( surface ).toHaveCSS( 'padding', '17px' );
		const popupBox = await expectBesideDay( page, surface );
		const hoveredBar = ( await bars.nth( 21 ).boundingBox() )!;
		const barCenter = hoveredBar.x + hoveredBar.width / 2;
		const barMiddle = hoveredBar.y + hoveredBar.height / 2;
		expect( popupBox.x ).toBeGreaterThan( barCenter );
		await expect( popover ).toHaveCSS( 'pointer-events', 'none' );
		// One jump per day, each onto the day the previous box covers.
		for ( let index = 21; index <= 27; index++ ) {
			const bar = ( await bars.nth( index ).boundingBox() )!;
			const x = bar.x + bar.width / 2;
			await page.mouse.move( x, barMiddle );
			await expect( surface.locator( '.jetpack-boost-overview__tooltip-date' ) ).toHaveText(
				`September ${ index - 20 }, 2026`
			);
			expect(
				await page.evaluate(
					( [ px, py ] ) =>
						Boolean(
							document.elementFromPoint( px, py )?.closest( '.boost-daily-history__popover' )
						),
					[ x, barMiddle ]
				)
			).toBe( false );
		}
		await page.mouse.move( 0, 0 );
		await expect( popover ).toBeHidden();
		await hoverDay( chart, 21 );
		await expect( surface.locator( '.jetpack-boost-overview__tooltip-date' ) ).toHaveCSS(
			'font-weight',
			'500'
		);
		const sections = surface.locator( '.jetpack-boost-overview__tooltip-section' );
		for ( const [ index, label, score, metrics, barColor ] of [
			[ 1, 'Desktop', '80/100', [ '1.20s', '0.10s', '0.01' ], 'rgb(0, 128, 48)' ],
			[ 2, 'Mobile', '65/100', [ '2.10s', '0.30s', '0.04' ], 'rgb(250, 167, 84)' ],
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
			expect( fill ).toBe( barColor );
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
		const emptyColor = await getEmptyDayColor( page );
		await expect( bars.first() ).toHaveCSS( 'fill', emptyColor );
		await expect( bars.first() ).toHaveCSS( 'height', '4px' );
		await expect( bars.first() ).toHaveCSS( 'stroke-dasharray', 'none' );
		const grid = chart.getByRole( 'grid' );
		await grid.focus();
		await page.keyboard.press( 'ArrowRight' );
		const surface = page.locator(
			'.boost-daily-history__popover .jetpack-boost-overview__history-tooltip'
		);
		await expect( surface ).toContainText( 'August 26, 2026' );
		await expect( surface ).toHaveCSS( 'background-color', /^rgb\(/ );
		await expect( surface ).toContainText( 'No scores recorded for this day.' );
		await page.keyboard.press( 'ArrowRight' );
		await expect( surface ).toContainText( 'August 27, 2026' );
		await page.keyboard.press( 'Escape' );
		await expect( surface ).toBeHidden();
		const popover = page.locator( '.boost-daily-history__popover' );
		for ( const [ index, date ] of [
			[ 6, 'September 1, 2026' ],
			[ 12, 'September 7, 2026' ],
		] as const ) {
			await hoverDay( chart, index );
			await expect( popover.locator( '.jetpack-boost-overview__tooltip-date' ) ).toHaveText( date );
			await expectClearOfCard( page, popover );
		}
		const zeroBar = bars.nth( 12 );
		await expect( zeroBar ).toHaveAttribute( 'fill', 'var(--jetpack-boost-score-poor)' );
		await expect( zeroBar ).not.toHaveCSS( 'fill', 'none' );
		expect( ( await zeroBar.boundingBox() )!.height ).toBeGreaterThan( 0 );
		await expect( popover ).toContainText( '0/100' );
		await expectBesideDay( page, popover );
	} );
}

for ( const [ label, query, copy, height ] of [
	[ 'a later empty day', '', 'No scores recorded for this day.', '86px' ],
	[
		'a day before the first score',
		'?noOlderHistory',
		'No scores recorded before the feature was unlocked.',
		'106px',
	],
] as const ) {
	test( `uses compact plots with three horizontal gridlines and no band legend (${ label })`, async ( {
		page,
	} ) => {
		await page.goto( `http://boost-history.test/${ query }` );
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
		const secondPanel = ( await mobile.boundingBox() )!;
		const bar = ( await desktop.locator( '.visx-bar' ).first().boundingBox() )!;
		expect( band.y ).toBeCloseTo( firstPanel.y, 0 );
		expect( band.y + band.height ).toBeCloseTo( secondPanel.y + secondPanel.height, 0 );
		expect( band.width ).toBeCloseTo( bar.width + 1, 0 );
		const tooltip = page.locator(
			'.boost-daily-history__popover .jetpack-boost-overview__history-tooltip'
		);
		await expect( tooltip ).toContainText( copy );
		await expect( tooltip ).toHaveCSS( 'width', '265px' );
		await expect( tooltip ).toHaveCSS( 'height', height );
		const emptyPopup = ( await tooltip.boundingBox() )!;
		expect( emptyPopup.y ).toBeGreaterThanOrEqual( firstPanel.y );
		expect( emptyPopup.y + emptyPopup.height ).toBeLessThanOrEqual(
			secondPanel.y + secondPanel.height
		);
		await expect( tooltip.locator( '.jetpack-boost-overview__tooltip-date' ) ).toHaveCSS(
			'font-weight',
			'500'
		);
	} );
}

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
		await expect( bars.first() ).toHaveAttribute( 'y', ( await zeroBar.getAttribute( 'y' ) )! );
		const emptyColor = await getEmptyDayColor( page );
		await expect( bars.first() ).toHaveCSS( 'fill', emptyColor );
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

test( 'Tab from the paging controls reaches the chart once the day details close', async ( {
	page,
} ) => {
	const chart = page.getByRole( 'region', { name: 'Desktop score history' } );
	const grid = chart.getByRole( 'grid' );
	const next = page.getByRole( 'button', { name: 'Next 30 days' } );
	const popover = page.locator( '.boost-daily-history__popover' );
	const openByPointer = async () => {
		await hoverDay( chart, 21 );
		await expect( popover ).toBeVisible();
		await page.mouse.move( 0, 0 );
	};
	const openByKeyboard = async () => {
		await grid.focus();
		for ( let day = 0; day <= 21; day++ ) {
			await page.keyboard.press( 'ArrowRight' );
		}
		await expect( popover ).toBeVisible();
		await page.keyboard.press( 'Escape' );
	};
	for ( const open of [ openByPointer, openByKeyboard ] ) {
		await open();
		await expect( popover ).toHaveCount( 0 );
		await expect( page.locator( '[data-base-ui-focus-guard]' ) ).toHaveCount( 0 );
		await next.focus();
		await page.keyboard.press( 'Tab' );
		await expect( grid ).toBeFocused();
	}
} );

test( 'Hiding retained history removes a keyboard tooltip until another selection', async ( {
	page,
} ) => {
	const grid = page.getByRole( 'region', { name: 'Desktop score history' } ).getByRole( 'grid' );
	const popover = page.locator( '.boost-daily-history__popover' );
	await grid.focus();
	await page.keyboard.press( 'ArrowRight' );
	await expect( page.getByRole( 'tooltip' ) ).toHaveCount( 1 );
	await expect( popover ).toBeVisible();
	await page.getByRole( 'button', { name: 'Toggle history' } ).click();
	await expect( page.getByRole( 'tooltip' ) ).toHaveCount( 0 );
	await expect( popover ).toHaveCount( 0 );
	await page.getByRole( 'button', { name: 'Toggle history' } ).click();
	await expect( page.getByRole( 'tooltip' ) ).toHaveCount( 0 );
	await expect( popover ).toHaveCount( 0 );
	await grid.focus();
	await page.keyboard.press( 'ArrowRight' );
	await expect( page.getByRole( 'tooltip' ) ).toHaveCount( 1 );
	await expect( popover ).toBeVisible();
} );

test( 'Score cards show gain badges, points help, and responsive dividers', async ( { page } ) => {
	await page.goto( 'http://boost-history.test/?scores' );
	const desktop = page.getByRole( 'region', { name: 'Desktop', exact: true } );
	const mobile = page.getByRole( 'region', { name: 'Mobile', exact: true } ).first();
	const overall = page.getByRole( 'region', { name: 'Overall', exact: true } );
	await expect( desktop.first().getByText( 'Good', { exact: true } ) ).toBeVisible();
	await expect( mobile.getByText( 'Could improve', { exact: true } ) ).toBeVisible();
	await expect( desktop.nth( 1 ).getByText( 'Poor', { exact: true } ) ).toBeVisible();
	await expect( overall.first().getByText( 'Good', { exact: true } ) ).toBeVisible();
	await expect( overall.nth( 1 ).getByText( 'Poor', { exact: true } ) ).toBeVisible();
	await expect( overall.getByRole( 'progressbar' ) ).toHaveCount( 0 );
	await expect( mobile.getByText( 'Could improve', { exact: true } ) ).toHaveCSS(
		'color',
		'rgb(147, 99, 0)'
	);
	for ( const [ card, score, color ] of [
		[ desktop.first(), 90, 'color(srgb 0 0.501961 0.188235 / 0.9)' ],
		[ mobile, 60, 'color(srgb 0.980392 0.654902 0.329412 / 0.9)' ],
		[ desktop.nth( 1 ), 40, 'color(srgb 0.8 0.0941176 0.0941176 / 0.9)' ],
	] as const ) {
		await expect( card.getByRole( 'progressbar' ) ).toHaveJSProperty( 'value', score );
		await expect( card.getByRole( 'progressbar' ) ).toHaveAttribute( 'max', '100' );
		const track = card.locator( '.jetpack-boost-overview__progress' );
		await expect( track.locator( ':scope > div' ) ).toHaveCSS( 'background-color', color );
		await expect( track ).toHaveCSS( 'background-color', 'rgba(0, 0, 0, 0)' );
		await expect( track ).toHaveCSS( 'height', '4px' );
		await expect( track ).toHaveCSS( 'border-radius', '4px' );
	}
	const positiveBadge = desktop.first().getByText( '+10 points', { exact: true } );
	await expect( positiveBadge ).toHaveCSS( 'background-color', 'rgb(222, 235, 250)' );
	await expect( positiveBadge ).toHaveCSS( 'color', 'rgb(0, 27, 79)' );
	await expect( mobile.getByText( /points/ ) ).toHaveCount( 0 );
	await expect( mobile.getByRole( 'button', { name: 'About points' } ) ).toHaveCount( 0 );
	await expect( desktop.nth( 1 ).getByText( /points/ ) ).toHaveCount( 0 );
	await expect( desktop.nth( 1 ).getByRole( 'button' ) ).toHaveCount( 0 );
	const pointsHelp = page.getByText( 'Points gained from optimizations', { exact: true } );
	await expect( pointsHelp ).toHaveCount( 0 );
	const pointsTrigger = desktop.first().getByRole( 'button', { name: 'About points' } );
	await pointsTrigger.hover();
	await expect( pointsHelp ).toBeVisible();
	await page.mouse.move( 0, 0 );
	await expect( pointsHelp ).toBeHidden();
	await pointsTrigger.click();
	await expect( pointsHelp ).toBeVisible();
	await page.keyboard.press( 'Escape' );
	await expect( pointsHelp ).toBeHidden();
	await expect( pointsTrigger ).toBeFocused();
	await pointsTrigger.press( 'Enter' );
	await expect( pointsHelp ).toBeVisible();
	await page.keyboard.press( 'Escape' );
	await expect( pointsHelp ).toBeHidden();
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
	const section = ( await desktop.first().boundingBox() )!;
	const bar = ( await desktop
		.first()
		.locator( '.jetpack-boost-overview__progress' )
		.boundingBox() )!;
	const delta = ( await desktop
		.first()
		.locator( '.jetpack-boost-overview__delta' )
		.boundingBox() )!;
	expect( bar.width ).toBeGreaterThan( 0 );
	expect( delta.x ).toBeGreaterThan( bar.x + bar.width );
	expect( delta.x + delta.width ).toBeLessThanOrEqual( section.x + section.width - 20 );
	expect( delta.y ).toBeLessThan( bar.y + bar.height );
	expect( delta.y + delta.height ).toBeGreaterThan( bar.y );
	const badgeBox = ( await positiveBadge.boundingBox() )!;
	const iconBox = ( await desktop.first().getByRole( 'button' ).boundingBox() )!;
	expect( iconBox.x ).toBeGreaterThan( badgeBox.x + badgeBox.width );
	expect( iconBox.y ).toBeLessThan( badgeBox.y + badgeBox.height );
	await page.goto( 'http://boost-history.test/?score-states' );
	const zeroBadge = page.getByText( '0 points', { exact: true } );
	await expect( zeroBadge ).toBeVisible();
	await expect( zeroBadge ).toHaveCSS( 'background-color', 'rgb(255, 255, 255)' );
	await expect( zeroBadge ).toHaveCSS( 'border-top-width', '1px' );
	await expect( zeroBadge ).toHaveCSS( 'border-top-style', 'solid' );
	await expect( zeroBadge ).toHaveCSS( 'border-top-color', 'rgb(219, 219, 219)' );
} );

test( 'Score cards show calculating and failed states inside the card', async ( { page } ) => {
	await page.goto( 'http://boost-history.test/?score-states' );
	const [ calculating, failed, failedRefresh ] = await page
		.locator( '.jetpack-boost-overview__scores-card' )
		.all();
	await expect( calculating.getByRole( 'heading', { name: 'Your site speed' } ) ).toBeVisible();
	const status = calculating.getByRole( 'status' );
	await expect( status.getByText( 'Calculating…' ) ).toHaveCSS( 'color', 'rgb(112, 112, 112)' );
	await expect( status.locator( '.components-spinner' ) ).toHaveCount( 1 );
	const spinner = ( await status.locator( '.components-spinner' ).boundingBox() )!;
	const label = ( await status.getByText( 'Calculating…' ).boundingBox() )!;
	expect( Math.abs( label.x - ( spinner.x + spinner.width ) ) ).toBeCloseTo( 12, 0 );
	await expect( calculating.getByRole( 'region' ) ).toHaveCount( 0 );
	await expect( failed.getByText( 'Failed to load speed scores' ) ).toBeVisible();
	await expect( failed.getByText( 'Timed out while waiting for speed-score.' ) ).toBeVisible();
	await expect( failed.getByRole( 'button', { name: 'Try again' } ) ).toHaveCSS(
		'background-color',
		'rgb(56, 88, 233)'
	);
	await expect( failed.getByRole( 'region' ) ).toHaveCount( 0 );
	const notice = ( await failedRefresh.getByText( 'Failed to load speed scores' ).boundingBox() )!;
	const desktop = failedRefresh.getByRole( 'region', { name: 'Desktop', exact: true } );
	await expect( desktop.getByRole( 'progressbar' ) ).toHaveJSProperty( 'value', 80 );
	expect( ( await desktop.boundingBox() )!.y ).toBeGreaterThan( notice.y + notice.height );
} );

test.describe( 'Day details on touch', () => {
	test.use( { hasTouch: true } );

	test( 'a tap on the open box reaches nothing under it', async ( { page } ) => {
		const chart = page.getByRole( 'region', { name: 'Desktop score history' } );
		const bar = ( await chart.locator( '.visx-bar' ).nth( 21 ).boundingBox() )!;
		await page.touchscreen.tap( bar.x + bar.width / 2, bar.y + bar.height / 2 );
		const popover = page.locator( '.boost-daily-history__popover' );
		const date = popover.locator( '.jetpack-boost-overview__tooltip-date' );
		await expect( date ).toHaveText( 'September 1, 2026' );
		await expect( popover ).toHaveCSS( 'pointer-events', 'auto' );
		const box = ( await popover.boundingBox() )!;
		const target = [ box.x + 20, bar.y + bar.height / 2 ];
		expect(
			await page.evaluate(
				( [ px, py ] ) =>
					Boolean(
						document.elementFromPoint( px, py )?.closest( '.boost-daily-history__popover' )
					),
				target
			)
		).toBe( true );
		await page.touchscreen.tap( target[ 0 ], target[ 1 ] );
		await expect( popover ).toBeVisible();
		await expect( date ).toHaveText( 'September 1, 2026' );
	} );
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
		await expect( popup ).toContainText(
			'Your overall score is a summary of your first Cornerstone Page across both mobile and desktop devices.'
		);
		await expect( popup ).not.toContainText( 'general idea' );
		await expect( popup.getByText( 'Overall grade' ) ).not.toBeInViewport();
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

for ( const { width, days } of [
	{ width: 1280, days: 30 },
	{ width: 390, days: 15 },
] ) {
	test.describe( `first history entry at ${ width }px`, () => {
		test.afterEach( async ( { page } ) => {
			if ( process.env.BOOST_HISTORY_EVIDENCE_DIR ) {
				await page.screenshot( {
					path: path.join( process.env.BOOST_HISTORY_EVIDENCE_DIR, `first-entry-${ width }.png` ),
					fullPage: true,
				} );
			}
		} );

		test( `first history entry shows one score per chart at ${ width }px`, async ( { page } ) => {
			await page.setViewportSize( { width, height: 900 } );
			await page.goto( 'http://boost-history.test/?firstEntry' );
			await expect( page.getByText( 'Sep 9, 2026', { exact: true } ) ).toBeVisible();
			await expect(
				page.getByRole( 'button', { name: `Previous ${ days } days` } )
			).toBeDisabled();
			await expect( page.getByText( /Jetpack Boost premium has been activated/ ) ).toHaveCount( 0 );
			await expect( page.getByText( /Your scores will be recorded from now on/ ) ).toHaveCount( 0 );
			for ( const device of [ 'Desktop', 'Mobile' ] ) {
				const bars = page
					.getByRole( 'region', { name: `${ device } score history` } )
					.locator( '.visx-bar' );
				await expect( bars ).toHaveCount( days );
				const heights = await bars.evaluateAll( elements =>
					elements.map( element => element.getBoundingClientRect().height )
				);
				expect( heights.filter( height => height === 4 ) ).toHaveLength( days - 1 );
				expect( heights[ days - 1 ] ).toBeGreaterThan( 4 );
			}
		} );
	} );
}
