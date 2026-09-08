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

test( 'History tooltip stays above the date axis and paints above annotations', async ( {
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
	expect( upperPosition!.y + upperPosition!.height ).toBeLessThanOrEqual( axis!.y );
	expect( axis!.y - upperPosition!.y - upperPosition!.height ).toBeLessThan( 24 );
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
	const result = await chart.evaluate( element => {
		const popup = element.querySelector( '.jetpack-boost-overview__history-tooltip' )!;
		const box = popup.getBoundingClientRect();
		let overlaps = 0;
		let obscured = 0;
		// Include pointer-transparent tooltips and annotations in the browser's paint-order hit test.
		const style = document.createElement( 'style' );
		style.textContent =
			'.jetpack-boost-overview__chart-canvas * { pointer-events: auto !important; }';
		document.head.append( style );
		try {
			for ( const label of element.querySelectorAll( '.visx-annotationlabel' ) ) {
				const rect = label.getBoundingClientRect();
				const left = Math.max( box.left, rect.left );
				const right = Math.min( box.right, rect.right );
				const top = Math.max( box.top, rect.top );
				const bottom = Math.min( box.bottom, rect.bottom );
				if ( left >= right || top >= bottom ) {
					continue;
				}
				overlaps++;
				const elements = document.elementsFromPoint( ( left + right ) / 2, ( top + bottom ) / 2 );
				const tooltipIndex = elements.findIndex( node => popup.contains( node ) );
				const labelIndex = elements.findIndex( node => label.contains( node ) );
				if ( tooltipIndex < 0 || labelIndex < 0 || tooltipIndex > labelIndex ) {
					obscured++;
				}
			}
		} finally {
			style.remove();
		}
		return { overlaps, obscured };
	} );
	expect(
		result.overlaps,
		'The fixture must exercise annotation/tooltip overlap.'
	).toBeGreaterThan( 0 );
	expect( result.obscured, 'History tooltip must paint above overlapping annotation labels.' ).toBe(
		0
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
		expect( popup.y + popup.height ).toBeLessThanOrEqual( axis!.y );
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
