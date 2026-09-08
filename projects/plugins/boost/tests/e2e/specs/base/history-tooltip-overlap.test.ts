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

test.afterAll( async () => {
	if ( fixtureDirectory ) {
		await rm( fixtureDirectory, { recursive: true, force: true } );
	}
} );

test( 'History tooltip paints above annotations with an opaque surface', async ( { page } ) => {
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
	const chart = page.locator( '.jetpack-boost-overview__chart-canvas' );
	await expect( chart.locator( '.visx-annotationlabel' ).first() ).toBeVisible();
	const grid = chart.getByRole( 'grid' );
	const bounds = await grid.boundingBox();
	await grid.hover( { position: { x: bounds!.width / 2, y: 10 } } );
	const tooltip = chart.locator( '.visx-tooltip' );
	await expect( tooltip ).toBeVisible();
	const surface = tooltip.locator( '.jetpack-boost-overview__history-tooltip' );
	await expect( surface ).toHaveCSS( 'background-color', /^rgb\(/ );
	const result = await chart.evaluate( element => {
		const popup = element.querySelector( '.visx-tooltip' )!;
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
