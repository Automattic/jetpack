import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { test, expect, type Locator, type Page } from '@playwright/test';

const pluginRoot = fileURLToPath( new URL( '../../../../', import.meta.url ) );
let fixtureDirectory: string;

type Box = { x: number; y: number; width: number; height: number };

/**
 * Open the premium tooltip and return its popover content box.
 *
 * @param page - Fixture page.
 * @return Popover content locator.
 */
async function openTooltip( page: Page ): Promise< Locator > {
	// The icon is positioned out of flow, leaving the button itself with no box to click.
	await page.locator( '.icon-tooltip-wrapper button svg' ).first().click();
	const content = page.locator( '.icon-tooltip-container .components-popover__content' );
	await expect( content ).toBeVisible();
	return content;
}

/**
 * Hit-test a grid of points across a box, reporting which ones the popover paints.
 *
 * @param page - Fixture page.
 * @param box  - Box to sample.
 * @return One entry per sampled point.
 */
function paintedBy( page: Page, box: Box ) {
	return page.evaluate( ( { x, y, width, height } ) => {
		const popover = document.querySelector( '.icon-tooltip-container' )!;
		const points = [];
		for ( const px of [ x + 1, x + width / 2, x + width - 1 ] ) {
			for ( const py of [ y + 1, y + height / 2, y + height - 1 ] ) {
				points.push( popover.contains( document.elementFromPoint( px, py ) ) );
			}
		}
		return points;
	}, box );
}

test.use( { storageState: { cookies: [], origins: [] } } );

// See tests/e2e/README.md for the fixture's scope and standalone run command.
test.beforeAll( async () => {
	test.setTimeout( 180000 );
	fixtureDirectory = await mkdtemp( path.join( tmpdir(), 'boost-settings-tooltip-' ) );
	await promisify( execFile )(
		'pnpm',
		[
			'exec',
			'webpack',
			'--config',
			'tests/e2e/lib/fixtures/settings-tooltip.webpack.cjs',
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
	await page.route( 'http://boost-settings.test/**', async route => {
		const url = new URL( route.request().url() );
		const filename = url.pathname.slice( 1 );
		if ( filename.startsWith( 'wp-json' ) ) {
			return route.fulfill( { status: 200, contentType: 'application/json', body: '[]' } );
		}
		if ( filename ) {
			return route.fulfill( { path: path.join( fixtureDirectory, filename ) } );
		}
		const stylesheet = url.searchParams.has( 'rtl' )
			? 'settings-tooltip.rtl.css'
			: 'settings-tooltip.css';
		await route.fulfill( {
			contentType: 'text/html',
			body: `<!doctype html><html dir="${ url.searchParams.has( 'rtl' ) ? 'rtl' : 'ltr' }"><head>
				<meta charset="utf-8"><link rel="stylesheet" href="/${ stylesheet }"></head>
				<body style="margin: 80px 0"><div id="root"></div>
				<script src="/settings-tooltip.js"></script></body></html>`,
		} );
	} );
} );

test.afterAll( async () => {
	if ( fixtureDirectory ) {
		await rm( fixtureDirectory, { recursive: true, force: true } );
	}
} );

for ( const direction of [ 'ltr', 'rtl' ] as const ) {
	for ( const width of [ 1440, 782, 390 ] ) {
		test( `${ direction } ${ width }: the card does not clip the premium tooltip`, async ( {
			page,
		}, testInfo ) => {
			await page.setViewportSize( { width, height: 900 } );
			await page.goto( `http://boost-settings.test/${ direction === 'rtl' ? '?rtl' : '' }` );
			const content = await openTooltip( page );
			const box = ( await content.boundingBox() )!;

			// The popover leaves the clipping card for the slot outside it.
			const placement = await content.evaluate( element => ( {
				inCard: !! element.closest( '[class*="__root"]' ),
				inSlot: !! element.closest( '.jb-modern-settings-popovers' ),
				cardOverflow: getComputedStyle( document.querySelector( '[class*="__root"]' )! ).overflow,
			} ) );
			expect( placement ).toEqual( {
				inCard: false,
				inSlot: true,
				cardOverflow: 'clip',
			} );

			// Nothing is cut off: the whole popover is on screen and the popover
			// itself is what paints at every point across it.
			expect( box.x ).toBeGreaterThanOrEqual( 0 );
			expect( box.y ).toBeGreaterThanOrEqual( 0 );
			expect( box.x + box.width ).toBeLessThanOrEqual( width );
			expect( box.y + box.height ).toBeLessThanOrEqual( 900 );
			expect( await paintedBy( page, box ) ).toEqual( Array( 9 ).fill( true ) );

			// The upgrade button is sized by the popover, not spilling out of it.
			const cta = ( await page
				.locator( '.icon-tooltip-container button', { hasText: 'Upgrade now' } )
				.boundingBox() )!;
			expect( cta.x ).toBeGreaterThanOrEqual( box.x );
			expect( cta.x + cta.width ).toBeLessThanOrEqual( box.x + box.width );

			await testInfo.attach( `modern-${ direction }-${ width }.png`, {
				body: await page.screenshot(),
				contentType: 'image/png',
			} );
		} );
	}
}

test( 'the legacy dashboard keeps its inline popover and its 70vw mobile width', async ( {
	page,
}, testInfo ) => {
	await page.setViewportSize( { width: 390, height: 900 } );
	await page.goto( 'http://boost-settings.test/?legacy' );
	const content = await openTooltip( page );

	await expect( content ).toHaveCSS( 'width', '273px' );
	expect( await content.evaluate( element => !! element.closest( '.icon-tooltip-wrapper' ) ) ).toBe(
		true
	);

	await testInfo.attach( 'legacy-ltr-390.png', {
		body: await page.screenshot(),
		contentType: 'image/png',
	} );
} );

test( 'tabbing out of the portaled tooltip resumes from the trigger', async ( { page } ) => {
	await page.setViewportSize( { width: 1440, height: 900 } );
	await page.goto( 'http://boost-settings.test/' );
	const trigger = page.locator( '.icon-tooltip-wrapper button' ).first();
	const content = page.locator( '.icon-tooltip-container .components-popover__content' );

	await trigger.focus();
	await page.keyboard.press( 'Space' );
	await expect( content ).toBeVisible();

	// This tooltip holds a CTA, so the first Tab has to reach it rather than dismiss.
	await page.keyboard.press( 'Tab' );
	await expect( page.getByRole( 'button', { name: 'Upgrade now' } ) ).toBeFocused();
	await expect( content ).toBeVisible();

	// Leaving it: the popover renders in a portal at the end of the document, so document order
	// would otherwise send Tab to whatever follows the portal, not to the trigger's neighbour.
	await page.keyboard.press( 'Tab' );
	await expect( content ).toBeHidden();
	await expect( page.getByRole( 'button', { name: 'Generate' } ) ).toBeFocused();

	await trigger.focus();
	await page.keyboard.press( 'Space' );
	await expect( content ).toBeVisible();
	await page.keyboard.press( 'Shift+Tab' );
	await expect( content ).toBeHidden();
	await expect( trigger ).not.toBeFocused();
} );

test( 'the premium tooltip keeps focus on its icon and closes on Escape', async ( { page } ) => {
	await page.setViewportSize( { width: 1440, height: 900 } );
	await page.goto( 'http://boost-settings.test/' );
	const trigger = page.locator( '.icon-tooltip-wrapper button' ).first();
	const content = await openTooltip( page );

	await expect( trigger ).toBeFocused();
	await page.keyboard.press( 'Escape' );
	await expect( content ).toBeHidden();
	await expect( trigger ).toBeFocused();
} );

test( 'the premium tooltip rings its icon on keyboard focus only', async ( { page } ) => {
	await page.setViewportSize( { width: 1440, height: 900 } );
	await page.goto( 'http://boost-settings.test/' );
	const trigger = page.locator( '.icon-tooltip-wrapper button' ).first();
	const icon = trigger.locator( 'svg' );

	await expect( async () => {
		await page.keyboard.press( 'Tab' );
		await expect( trigger ).toBeFocused( { timeout: 100 } );
	} ).toPass( { intervals: [ 0 ], timeout: 10000 } );
	await expect( icon ).toHaveCSS( 'outline-style', 'solid' );

	// Pressing the icon focuses the button too, but not visibly.
	await page.reload();
	const box = ( await icon.boundingBox() )!;
	await page.mouse.move( box.x + box.width / 2, box.y + box.height / 2 );
	await page.mouse.down();
	await expect( trigger ).toBeFocused();
	await expect( icon ).toHaveCSS( 'outline-style', 'none' );
	await page.mouse.up();
} );
