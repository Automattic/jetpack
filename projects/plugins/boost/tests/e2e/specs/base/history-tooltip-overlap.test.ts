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
		{ cwd: pluginRoot, maxBuffer: 10 * 1024 * 1024 }
	);
} );

test.beforeEach( async ( { page } ) => {
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

test( 'History tooltip stays below the date axis with matching series colors', async ( {
	page,
} ) => {
	const chart = page.locator( '.jetpack-boost-overview__chart-canvas' );
	await expect( chart.locator( '.visx-annotationlabel' ).first() ).toBeVisible();
	const grid = chart.getByRole( 'grid' );
	const bounds = await grid.boundingBox();
	await grid.hover( { position: { x: bounds!.width / 2, y: 10 } } );
	const surface = chart.locator( '.jetpack-boost-overview__history-tooltip' );
	await expect( surface ).toBeVisible();
	await expect( surface ).toHaveCSS( 'background-color', /^rgb\(/ );
	const upperPosition = await surface.boundingBox();
	const date = await surface.locator( ':scope > :first-child' ).textContent();
	await grid.hover( { position: { x: bounds!.width / 2, y: bounds!.height - 40 } } );
	await expect( surface.locator( ':scope > :first-child' ) ).toHaveText( date! );
	await expect
		.poll( async () => ( await surface.boundingBox() )!.y )
		.toBeCloseTo( upperPosition!.y, 0 );
	const axis = await chart.locator( '.visx-axis-tick line' ).first().boundingBox();
	expect( Math.abs( upperPosition!.y - axis!.y ) ).toBeLessThan( 1 );
	const pointer = surface.locator( '.jetpack-boost-overview__tooltip-pointer' );
	await expect( pointer ).toHaveCSS( 'border-top-width', '0px' );
	await expect( pointer ).toHaveCSS( 'border-bottom-width', '8px' );
	expect( ( await pointer.boundingBox() )!.y ).toBeLessThan( upperPosition!.y );
	const paint = await surface.evaluate( popup => {
		const box = popup.getBoundingClientRect();
		const card = popup.closest( '.jetpack-boost-overview__history-card' )!.getBoundingClientRect();
		const style = document.createElement( 'style' );
		style.textContent =
			'.jetpack-boost-overview__history-tooltip, .jetpack-boost-overview__history-tooltip * { pointer-events: auto !important; }';
		document.head.append( style );
		try {
			const hit = document.elementFromPoint(
				box.x + box.width / 2,
				( card.bottom + box.bottom ) / 2
			);
			return {
				extendsBelowCard: box.bottom > card.bottom,
				painted: !! hit && popup.contains( hit ),
			};
		} finally {
			style.remove();
		}
	} );
	expect( paint.extendsBelowCard ).toBe( true );
	expect( paint.painted, 'The card must not clip tooltip content below the chart.' ).toBe( true );
	const colors = await chart.evaluate( element => {
		const swatches = Array.from(
			element.querySelectorAll( '.jetpack-boost-overview__series-swatch' )
		);
		return {
			labels: Array.from(
				element.querySelectorAll( '[data-testid="legend-label"]' ),
				node => node.textContent
			),
			tooltipLabels: swatches.map( node => node.parentElement!.textContent ),
			swatches: swatches.map( node => getComputedStyle( node ).backgroundColor ),
			legend: Array.from(
				element.querySelectorAll( '.visx-legend-shape line' ),
				node => getComputedStyle( node ).stroke
			),
			lines: Array.from(
				element.querySelectorAll( 'path.visx-line' ),
				node => getComputedStyle( node ).stroke
			),
			areas: Array.from(
				element.querySelectorAll( 'path.visx-area' ),
				node => getComputedStyle( node ).fill
			),
		};
	} );
	expect( colors.labels ).toEqual( [ 'Desktop', 'Mobile' ] );
	expect( colors.tooltipLabels ).toEqual( [ 'Desktop score', 'Mobile score' ] );
	expect( colors.swatches ).toHaveLength( 2 );
	expect( new Set( colors.swatches ).size ).toBe( 2 );
	expect( colors.legend ).toEqual( colors.swatches );
	expect( colors.lines ).toEqual( colors.swatches );
	expect( colors.areas.every( fill => fill === 'none' || fill === 'rgba(0, 0, 0, 0)' ) ).toBe(
		true
	);
} );

test( 'History tooltip follows the hovered date and stays within a narrow viewport', async ( {
	page,
} ) => {
	await page.setViewportSize( { width: 390, height: 900 } );
	const chart = page.locator( '.jetpack-boost-overview__chart-canvas' );
	const grid = chart.getByRole( 'grid' );
	const surface = chart.locator( '.jetpack-boost-overview__history-tooltip' );
	await expect.poll( async () => ( await grid.boundingBox() )!.width ).toBeLessThan( 390 );
	const axis = await chart.locator( '.visx-axis-tick line' ).first().boundingBox();
	const positions = [];
	for ( const [ fraction, date ] of [
		[ 0, 'September 1, 2026' ],
		[ 1, 'September 7, 2026' ],
	] as const ) {
		const bounds = ( await grid.boundingBox() )!;
		await grid.hover( {
			position: { x: 50 + fraction * ( bounds.width - 80 ), y: bounds.height / 2 },
		} );
		await expect( surface.locator( ':scope > :first-child' ) ).toHaveText( date );
		const popup = ( await surface.boundingBox() )!;
		expect( popup.x ).toBeGreaterThanOrEqual( 0 );
		expect( popup.x + popup.width ).toBeLessThanOrEqual( 390 );
		expect( Math.abs( popup.y - axis!.y ) ).toBeLessThan( 1 );
		const dateX = await chart
			.locator( 'path.visx-line' )
			.first()
			.evaluate( ( element, end ) => {
				const line = element as SVGPathElement;
				const point = line.getPointAtLength( end * line.getTotalLength() );
				return point.matrixTransform( line.getScreenCTM()! ).x;
			}, fraction );
		const pointer = ( await surface
			.locator( '.jetpack-boost-overview__tooltip-pointer' )
			.boundingBox() )!;
		expect( pointer.x + pointer.width / 2 ).toBeCloseTo( dateX, 0 );
		positions.push( popup );
	}
	expect( positions[ 1 ].x ).toBeGreaterThan( positions[ 0 ].x );
	expect( positions[ 1 ].y ).toBeCloseTo( positions[ 0 ].y, 0 );
	await page.mouse.move( 0, 0 );
	await grid.focus();
	await grid.press( 'ArrowRight' );
	await expect( surface ).toBeVisible();
	const keyboardDate = await surface.locator( ':scope > :first-child' ).textContent();
	await grid.press( 'ArrowRight' );
	await expect( surface.locator( ':scope > :first-child' ) ).not.toHaveText( keyboardDate! );
	expect( ( await surface.boundingBox() )!.y ).toBeCloseTo( positions[ 0 ].y, 0 );
} );

test( 'Score cards show the tier palette, baseline delta colors, and responsive dividers', async ( {
	page,
} ) => {
	await page.goto( 'http://boost-history.test/?scores' );
	const desktop = page.getByRole( 'region', { name: 'Desktop', exact: true } );
	const mobile = page.getByRole( 'region', { name: 'Mobile', exact: true } ).first();
	await expect( desktop.first().getByRole( 'progressbar' ) ).toHaveCSS( 'color', 'rgb(6, 158, 8)' );
	await expect( mobile.getByRole( 'progressbar' ) ).toHaveCSS( 'color', 'rgb(250, 167, 84)' );
	await expect( desktop.nth( 1 ).getByRole( 'progressbar' ) ).toHaveCSS(
		'color',
		'rgb(214, 54, 56)'
	);
	await expect( desktop.first().getByText( '+10 points compared to without Boost' ) ).toHaveCSS(
		'color',
		'rgb(0, 135, 16)'
	);
	await expect( mobile.getByText( '−10 points compared to without Boost' ) ).toHaveCSS(
		'color',
		'rgb(214, 54, 56)'
	);
	const headerDivider = page.locator( '.jetpack-boost-overview__scores-divider' ).first();
	await expect( headerDivider ).toBeVisible();
	await expect( headerDivider ).toHaveCSS( 'border-bottom-width', '1px' );
	await expect( headerDivider ).toHaveCSS( 'border-bottom-style', 'solid' );
	await expect( headerDivider ).not.toHaveCSS( 'border-bottom-color', 'rgba(0, 0, 0, 0)' );
	await expect( desktop.first() ).toHaveCSS( 'border-left-width', '1px' );
	await expect( desktop.first() ).toHaveCSS( 'border-left-style', 'solid' );
	await expect( desktop.first() ).not.toHaveCSS( 'border-left-color', 'rgba(0, 0, 0, 0)' );
	await page.setViewportSize( { width: 390, height: 900 } );
	await expect( desktop.first() ).toHaveCSS( 'border-left-width', '0px' );
	await expect( desktop.first() ).toHaveCSS( 'border-top-width', '1px' );
	await expect( desktop.first() ).toHaveCSS( 'border-top-style', 'solid' );
	await expect( desktop.first() ).not.toHaveCSS( 'border-top-color', 'rgba(0, 0, 0, 0)' );
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
