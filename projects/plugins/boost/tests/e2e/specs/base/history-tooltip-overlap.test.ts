import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test, expect } from '@playwright/test';
import type { Locator } from '@playwright/test';

const pluginRoot = fileURLToPath( new URL( '../../../../', import.meta.url ) );
let fixtureDirectory: string;

/**
 * Verify that the tooltip pointer leaves the entire date label band clear.
 * @param chart   - Chart containing the date labels.
 * @param pointer - Visible tooltip pointer.
 */
async function expectPointerBelowDateLabels( chart: Locator, pointer: Locator ) {
	const labels = chart.locator( '.visx-axis-tick text' ).filter( {
		hasText: /^[A-Z][a-z]{2} \d{1,2}$/,
	} );
	const dateLabels = await labels.all();
	expect( dateLabels.length ).toBeGreaterThan( 0 );
	const pointerBox = ( await pointer.boundingBox() )!;
	for ( const label of dateLabels ) {
		await expect( label ).toBeVisible();
		const labelBox = ( await label.boundingBox() )!;
		expect( pointerBox.y ).toBeGreaterThanOrEqual( labelBox.y + labelBox.height );
	}
}

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
	const surface = page.locator( '.jetpack-boost-overview__history-tooltip' );
	await expect( surface ).toBeVisible();
	await expect( page.getByTestId( 'bounded-tooltip' ) ).toHaveCSS(
		'background-color',
		'rgb(30, 30, 30)'
	);
	const upperPosition = await surface.boundingBox();
	const date = await surface.locator( ':scope > :first-child' ).textContent();
	await grid.hover( { position: { x: bounds!.width / 2, y: bounds!.height - 40 } } );
	await expect( surface.locator( ':scope > :first-child' ) ).toHaveText( date! );
	await expect
		.poll( async () => ( await surface.boundingBox() )!.y )
		.toBeCloseTo( upperPosition!.y, 0 );
	const axis = await chart.locator( '.visx-axis-tick line' ).first().boundingBox();
	const pointer = page.getByTestId( 'tooltip-axis-pointer' );
	const tooltipBox = page.getByTestId( 'bounded-tooltip' );
	const pointerPosition = ( await pointer.boundingBox() )!;
	await expectPointerBelowDateLabels( chart, pointer );
	expect( ( await tooltipBox.boundingBox() )!.y ).toBeCloseTo(
		pointerPosition.y + pointerPosition.height,
		0
	);
	expect( upperPosition!.y ).toBeGreaterThan( axis!.y );
	await expect( page.getByRole( 'tooltip' ) ).toContainText( 'Desktop score' );
	await expect( page.getByRole( 'tooltip' ) ).toContainText( 'Mobile score' );
	const hoverColumn = chart.getByTestId( 'xy-chart-tooltip-crosshair-vertical' );
	await expect( hoverColumn ).toHaveCSS( 'visibility', 'visible' );
	await expect( hoverColumn ).not.toHaveCSS( 'display', 'none' );
	const columnWidth = await hoverColumn.evaluate( element =>
		parseFloat( getComputedStyle( element ).strokeWidth )
	);
	expect.soft( columnWidth ).toBe( 40 );
	await expect.soft( hoverColumn ).toHaveCSS( 'stroke', 'rgb(244, 244, 244)' );
	await expect.soft( hoverColumn ).toHaveCSS( 'mix-blend-mode', 'multiply' );
	const columnBounds = await hoverColumn.evaluate( element => {
		const { x, width, height } = element.getBoundingClientRect();
		return { x, width, height };
	} );
	expect( columnBounds.height ).toBeGreaterThan( 0 );
	const pointerBounds = ( await pointer.boundingBox() )!;
	expect( columnBounds.x + columnBounds.width / 2 ).toBeCloseTo(
		pointerBounds.x + pointerBounds.width / 2,
		0
	);

	const painted = await surface.evaluate( popup => {
		const box = popup.getBoundingClientRect();
		const style = document.createElement( 'style' );
		style.textContent =
			'.jetpack-boost-overview__history-tooltip, .jetpack-boost-overview__history-tooltip * { pointer-events: auto !important; }';
		document.head.append( style );
		try {
			const hit = document.elementFromPoint( box.x + box.width / 2, box.bottom - 1 );
			return !! hit && popup.contains( hit );
		} finally {
			style.remove();
		}
	} );
	expect( painted, 'The tooltip content remains visible below the chart.' ).toBe( true );
	const typography = await surface.evaluate( popup => {
		const sections = Array.from(
			popup.querySelectorAll( '.jetpack-boost-overview__tooltip-section' )
		);
		return {
			dateWeight: getComputedStyle( popup.firstElementChild! ).fontWeight,
			dateGap: parseFloat( getComputedStyle( popup.firstElementChild! ).marginBottom ),
			devices: sections.slice( 1 ).map( section => ( {
				headingWeight: getComputedStyle( section.children[ 0 ] ).fontWeight,
				scoreWeight: getComputedStyle( section.children[ 1 ] ).fontWeight,
				metricWeights: Array.from( section.children )
					.slice( 2 )
					.map( metric => getComputedStyle( metric ).fontWeight ),
				rowGap: parseFloat( getComputedStyle( section ).rowGap ),
				sectionGap: parseFloat( getComputedStyle( section ).marginTop ),
			} ) ),
		};
	} );
	expect( Number( typography.dateWeight ) ).toBeGreaterThan( 400 );
	expect( typography.dateGap ).toBeGreaterThan( 0 );
	for ( const device of typography.devices ) {
		expect( Number( device.headingWeight ) ).toBeGreaterThan( 400 );
		expect( device.scoreWeight ).toBe( device.headingWeight );
		expect( device.metricWeights ).toEqual( Array( 6 ).fill( '400' ) );
		expect( device.rowGap ).toBeGreaterThan( 0 );
		expect( device.sectionGap ).toBeGreaterThan( 0 );
	}
	const colors = await surface.evaluate( popup => {
		const element = document;
		const swatches = Array.from(
			popup.querySelectorAll( '.jetpack-boost-overview__series-swatch' )
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
	expect( colors.lines ).toEqual( [ 'rgb(56, 88, 233)', 'rgb(0, 128, 48)' ] );
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
	const surface = page.locator( '.jetpack-boost-overview__history-tooltip' );
	await expect.poll( async () => ( await grid.boundingBox() )!.width ).toBeLessThan( 390 );
	const axis = await chart.locator( '.visx-axis-tick line' ).first().boundingBox();
	const positions = [];
	for ( const [ fraction, date ] of [
		[ 0, 'September 1, 2026' ],
		[ 1, 'September 7, 2026' ],
	] as const ) {
		const datePoint = await chart
			.locator( 'path.visx-line' )
			.first()
			.evaluate( ( element, end ) => {
				const line = element as SVGPathElement;
				const point = line.getPointAtLength( end * line.getTotalLength() );
				const screenPoint = point.matrixTransform( line.getScreenCTM()! );
				return { x: screenPoint.x, y: screenPoint.y };
			}, fraction );
		await page.mouse.move( datePoint.x, datePoint.y );
		await expect( surface.locator( ':scope > :first-child' ) ).toHaveText( date );
		const popup = ( await surface.boundingBox() )!;
		expect( popup.x ).toBeGreaterThanOrEqual( 0 );
		expect( popup.x + popup.width ).toBeLessThanOrEqual( 390 );
		expect( popup.y ).toBeGreaterThan( axis!.y );
		const pointerElement = page.getByTestId( 'tooltip-axis-pointer' );
		const pointer = ( await pointerElement.boundingBox() )!;
		await expectPointerBelowDateLabels( chart, pointerElement );
		expect( pointer.x + pointer.width / 2 ).toBeCloseTo( datePoint.x, 0 );
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
	await expectPointerBelowDateLabels( chart, page.getByTestId( 'tooltip-axis-pointer' ) );
} );

test( 'Hiding retained history removes a keyboard tooltip until another selection', async ( {
	page,
} ) => {
	const grid = page.getByRole( 'grid' );
	await grid.focus();
	await grid.press( 'ArrowRight' );
	await expect( page.getByRole( 'tooltip' ) ).toBeVisible();
	await page.getByRole( 'button', { name: 'Toggle history' } ).click();
	await expect( page.getByRole( 'tooltip' ) ).toHaveCount( 0 );
	await page.getByRole( 'button', { name: 'Toggle history' } ).click();
	await expect( page.getByRole( 'tooltip' ) ).toHaveCount( 0 );
	await grid.focus();
	await grid.press( 'ArrowRight' );
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
	await expect( overall.first().getByText( 'Could be improved', { exact: true } ) ).toBeVisible();
	await expect( overall.nth( 1 ).getByText( 'Poor', { exact: true } ) ).toBeVisible();
	await expect( desktop.first().getByRole( 'progressbar' ) ).toHaveCSS(
		'color',
		'rgb(0, 128, 48)'
	);
	await expect( mobile.getByRole( 'progressbar' ) ).toHaveCSS( 'color', 'rgb(146, 99, 0)' );
	await expect( desktop.nth( 1 ).getByRole( 'progressbar' ) ).toHaveCSS(
		'color',
		'rgb(204, 24, 24)'
	);
	await expect( desktop.first().getByText( '+10 points compared to without Boost' ) ).toHaveCSS(
		'color',
		'rgb(0, 128, 48)'
	);
	await expect( mobile.getByText( '−10 points compared to without Boost' ) ).toHaveCSS(
		'color',
		'rgb(204, 24, 24)'
	);
	await expect( desktop.first() ).toHaveCSS( 'padding-top', '16px' );
	await expect( desktop.first() ).toHaveCSS( 'padding-bottom', '16px' );
	await expect( desktop.first() ).toHaveCSS( 'padding-left', '20px' );
	await expect( desktop.first() ).toHaveCSS( 'padding-right', '20px' );
	await expect( desktop.first() ).toHaveCSS( 'gap', '8px' );
	await expect( desktop.first().getByRole( 'progressbar' ) ).toHaveCSS( 'height', '4px' );
	await expect( desktop.first().getByRole( 'progressbar' ) ).toHaveCSS( 'border-radius', '4px' );
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
