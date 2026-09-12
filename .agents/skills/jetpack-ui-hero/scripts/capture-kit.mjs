/* global process */
/*
 * Helpers for capturing a piece of WordPress admin UI as hero-animation layers.
 *
 * Import from a per-task capture script; every function here exists because the
 * naive version of it silently produced a wrong capture. See
 * references/capture-traps.md for why each one is shaped the way it is.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Pause for a number of milliseconds.
 *
 * @param {number} ms - How long to wait.
 * @return {Promise<void>} Resolves when the time has passed.
 */
export const sleep = ms => new Promise( r => setTimeout( r, ms ) );

/*
 * The monorepo hoists playwright into pnpm's store, so `import 'playwright'`
 * fails from anywhere outside a package that depends on it. Find it on disk.
 * @param from
 */
/**
 * Resolve Playwright, which the monorepo hoists into pnpm's store where a bare
 * `import 'playwright'` cannot see it.
 *
 * @param {string} [from] - Directory to search upwards from.
 * @return {Promise<object>} The Playwright module namespace.
 */
export async function playwright( from = process.cwd() ) {
	try {
		// eslint-disable-next-line import/no-unresolved -- optional; found in the pnpm store below
		return await import( 'playwright' );
	} catch {
		/* fall through */
	}
	const roots = [ process.env.PLAYWRIGHT_ROOT, from ]
		.filter( Boolean )
		.map( r => resolve( r.replace( /^~(?=$|\/)/, process.env.HOME || '~' ) ) );
	for ( const root of roots ) {
		// Walk until dirname stops changing. A relative path or an unexpanded "~"
		// never reaches '/', and the loop blocks the event loop hard enough that a
		// watchdog timer never fires.
		for ( let dir = root, prev; dir !== prev; prev = dir, dir = dirname( dir ) ) {
			const store = join( dir, 'node_modules/.pnpm' );
			if ( ! existsSync( store ) ) continue;
			const hit = readdirSync( store )
				.filter( d => d.startsWith( 'playwright@' ) )
				.sort( ( a, b ) => a.localeCompare( b, undefined, { numeric: true } ) )
				.pop();
			if ( ! hit ) continue;
			// It is CommonJS, so the namespace lands on `.default`.
			const mod = await import(
				pathToFileURL( join( store, hit, 'node_modules/playwright/index.js' ) ).href
			);
			return mod.default ?? mod;
		}
	}
	throw new Error(
		'playwright not found. Run this from inside the Jetpack monorepo, or set ' +
			'PLAYWRIGHT_ROOT to a checkout that has it installed:\n' +
			'  PLAYWRIGHT_ROOT=~/a8c/jetpack node <script>'
	);
}

/*
 * Sign in through the one-shot `?auto_login` link and save the session.
 *
 * That link works exactly once. Never curl it, never paste it anywhere a preview
 * might fetch it — a fresh site is cheaper than repairing a consumed one.
 * @param page
 * @param domain
 * @param statePath
 */
/**
 * Sign in through the one-shot `?auto_login` link and save the session.
 *
 * That link works exactly once. Never curl it, and never paste it anywhere a link
 * preview might fetch it.
 *
 * @param {object} page      - Playwright page.
 * @param {string} domain    - Site domain, with or without a scheme.
 * @param {string} statePath - Where to write the storage state.
 * @return {Promise<string>} The path the state was written to.
 */
export async function login( page, domain, statePath ) {
	const site = domain.startsWith( 'http' ) ? domain : `https://${ domain }`;
	await page.goto( `${ site }/?auto_login`, { waitUntil: 'domcontentloaded', timeout: 90000 } );
	await sleep( 2500 );
	if ( ( await page.locator( '#wpadminbar' ).count() ) === 0 ) {
		throw new Error(
			`?auto_login did not sign in at ${ site } — the link was probably already consumed`
		);
	}
	await page.context().storageState( { path: statePath } );
	return statePath;
}

/*
 * Wait for a React admin screen to finish rendering. "Network idle" is not the
 * same thing: My Jetpack will happily screenshot with a spinner in every card.
 * @param page
 * @param root0
 * @param root0.timeout
 */
/**
 * Wait for a React admin screen to finish rendering. "Network idle" is not the same
 * thing: My Jetpack will happily screenshot with a spinner in every card.
 *
 * @param {object} page              - Playwright page.
 * @param {object} [options]         - Options.
 * @param {number} [options.timeout] - How long to wait, in ms.
 * @return {Promise<void>} Resolves once nothing is loading.
 */
export async function settle( page, { timeout = 20000 } = {} ) {
	await page
		.waitForFunction(
			() => ! document.querySelector( '.components-spinner, [aria-busy="true"], .is-loading' ),
			null,
			{ timeout }
		)
		.catch( () => {
			throw new Error( 'page still shows a spinner or aria-busy after waiting; do not capture it' );
		} );
	await sleep( 600 );
}

/*
 *
 * @param root0
 * @param root0.storageState
 * @param root0.width
 * @param root0.height
 * @param root0.scale
 */
/**
 * Launch a browser and page set up for capture.
 *
 * @param {object} [options]              - Options.
 * @param {string} [options.storageState] - Saved session to restore.
 * @param {number} [options.width]        - Viewport width.
 * @param {number} [options.height]       - Viewport height.
 * @param {number} [options.scale]        - Device scale factor.
 * @return {Promise<object>} `{ browser, ctx, page, errors }`.
 */
export async function open( { storageState, width = 1280, height = 900, scale = 2 } = {} ) {
	const { chromium } = await playwright();
	const browser = await chromium.launch();
	const ctx = await browser.newContext( {
		...( storageState ? { storageState } : {} ),
		viewport: { width, height },
		deviceScaleFactor: scale,
	} );
	const page = await ctx.newPage();
	const errors = [];
	page.on( 'pageerror', e => errors.push( String( e.message ) ) );
	return { browser, ctx, page, errors };
}

/*
 * Close any modal overlay and prove it is gone. An open modal does not break
 * DOM queries inside an iframe, so measurements look fine while every clipped
 * screenshot silently captures the modal instead.
 * @param page
 * @param tries
 */
/**
 * Close any modal overlay and prove it is gone.
 *
 * An open modal does not break DOM queries inside an iframe, so measurements look
 * correct while every clipped screenshot silently captures the modal instead.
 *
 * @param {object} page    - Playwright page.
 * @param {number} [tries] - How many times to try.
 * @return {Promise<void>} Resolves when no overlay remains.
 */
export async function dismissModals( page, tries = 6 ) {
	for ( let i = 0; i < tries; i++ ) {
		if ( ( await page.locator( '.components-modal__screen-overlay' ).count() ) === 0 ) return;
		await page.keyboard.press( 'Escape' );
		await sleep( 300 );
		if ( ( await page.locator( '.components-modal__screen-overlay' ).count() ) === 0 ) return;
		// Scope to the overlay: an unscoped aria-label="Close" plus force:true will
		// happily click a dismissible admin notice earlier in the DOM instead.
		const x = page
			.locator( '.components-modal__screen-overlay' )
			.locator( '.components-modal__header button, button[aria-label="Close"]' )
			.first();
		if ( await x.count() ) await x.click( { force: true } ).catch( () => {} );
		await sleep( 700 );
	}
	if ( await page.locator( '.components-modal__screen-overlay' ).count() ) {
		throw new Error( 'a modal overlay is still up; captures would be covered' );
	}
}

/*
 * Inject (or replace) a stylesheet in the page.
 * @param page
 * @param css
 */
/**
 * Inject or replace a stylesheet in the page.
 *
 * @param {object} page - Playwright page.
 * @param {string} css  - Stylesheet text.
 * @return {Promise<void>} Resolves once applied.
 */
export const hidePage = ( page, css ) =>
	page.evaluate( c => {
		let s = document.getElementById( 'hero-hide-page' );
		if ( ! s ) {
			s = document.createElement( 'style' );
			s.id = 'hero-hide-page';
			document.head.appendChild( s );
		}
		s.textContent = c;
	}, css );

/*
 * Inject (or replace) a stylesheet inside the block-editor canvas iframe.
 * @param page
 * @param css
 * @param name
 */
/**
 * Inject or replace a stylesheet inside the block-editor canvas iframe.
 *
 * @param {object} page   - Playwright page.
 * @param {string} css    - Stylesheet text.
 * @param {string} [name] - Iframe name attribute.
 * @return {Promise<void>} Resolves once applied.
 */
export const hideInFrame = ( page, css, name = 'editor-canvas' ) =>
	page.evaluate(
		( [ c, n ] ) => {
			const d = document.querySelector( `iframe[name="${ n }"]` ).contentDocument;
			let s = d.getElementById( 'hero-hide' );
			if ( ! s ) {
				s = d.createElement( 'style' );
				s.id = 'hero-hide';
				d.head.appendChild( s );
			}
			s.textContent = c;
		},
		[ css, name ]
	);

/*
 * Offset of the editor canvas iframe, which every rect measured inside it needs.
 * @param page
 * @param name
 */
/**
 * Offset of the editor canvas iframe, which every rect measured inside it needs.
 *
 * @param {object} page   - Playwright page.
 * @param {string} [name] - Iframe name attribute.
 * @return {Promise<object>} `{ x, y }` in page coordinates.
 */
export const frameOffset = ( page, name = 'editor-canvas' ) =>
	page.evaluate( n => {
		const f = document.querySelector( `iframe[name="${ n }"]` );
		// Returning {0,0} here would be a plausible-looking wrong answer: every rect
		// measured inside the frame would come out short by the frame's offset.
		if ( ! f ) throw new Error( `no iframe[name="${ n }"] on this page` );
		const r = f.getBoundingClientRect();
		return { x: +r.x.toFixed( 1 ), y: +r.y.toFixed( 1 ) };
	}, name );

/*
 * Measure named selectors. Pass `frame` to look inside the canvas iframe, and
 * `offset` (from frameOffset) to convert to page coordinates.
 *
 * @param          page
 * @param {object} map          - name -> CSS selector
 * @param {object} opts         - { frame, offset, styles }
 * @param          root0
 * @param          root0.frame
 * @param          opts.frame
 * @param          root0.offset
 * @param          opts.offset
 * @param          root0.styles
 * @param          opts.styles
 */
/**
 * Measure named selectors, one element each.
 *
 * @param {object}  page             - Playwright page.
 * @param {object}  map              - Map of name to CSS selector.
 * @param {object}  [options]        - Options.
 * @param {string}  [options.frame]  - Iframe name to look inside.
 * @param {object}  [options.offset] - Offset to add, from `frameOffset`.
 * @param {boolean} [options.styles] - Include computed styles.
 * @return {Promise<object>} Map of name to rect, or null where the selector missed.
 */
export function measure(
	page,
	map,
	{ frame = null, offset = { x: 0, y: 0 }, styles = true } = {}
) {
	return page.evaluate(
		( [ m, f, off, wantStyles ] ) => {
			const root = f ? document.querySelector( `iframe[name="${ f }"]` ).contentDocument : document;
			const out = {};
			for ( const [ name, sel ] of Object.entries( m ) ) {
				const el = root.querySelector( sel );
				if ( ! el ) {
					out[ name ] = null;
					continue;
				}
				const r = el.getBoundingClientRect();
				const rect = {
					x: +( r.x + off.x ).toFixed( 1 ),
					y: +( r.y + off.y ).toFixed( 1 ),
					w: +r.width.toFixed( 1 ),
					h: +r.height.toFixed( 1 ),
				};
				if ( wantStyles ) {
					const s = getComputedStyle( el );
					Object.assign( rect, {
						font: s.font,
						color: s.color,
						bg: s.backgroundColor,
						radius: s.borderRadius,
					} );
				}
				rect.text = ( el.innerText || '' ).replace( /\s+/g, ' ' ).trim().slice( 0, 80 );
				out[ name ] = rect;
			}
			return out;
		},
		[ map, frame, offset, styles ]
	);
}

/*
 * Screenshot a measured rect. Playwright wants width/height, not w/h.
 * @param page
 * @param rect
 * @param path
 */
/**
 * Screenshot a measured rect.
 *
 * @param {object} page - Playwright page.
 * @param {object} rect - Rect from `measure`.
 * @param {string} path - Where to write the PNG.
 * @return {Promise<object>} The screenshot buffer.
 */
export const crop = ( page, rect, path ) => {
	if ( ! rect )
		throw new Error(
			`crop(${ path }): no rect — the selector that should have produced it missed`
		);
	return page.screenshot( { path, clip: { x: rect.x, y: rect.y, width: rect.w, height: rect.h } } );
};

/*
 * Measure every match of one selector — needed for row pitch, which is
 * `rows[1].y - rows[0].y` and is NOT the same as a row's height.
 * @param page
 * @param selector
 * @param root0
 * @param root0.frame
 * @param root0.offset
 */
/**
 * Measure every match of one selector.
 *
 * Needed for row pitch, which is `rows[1].y - rows[0].y` and is not the same as a
 * row's height.
 *
 * @param {object} page             - Playwright page.
 * @param {string} selector         - CSS selector.
 * @param {object} [options]        - Options.
 * @param {string} [options.frame]  - Iframe name to look inside.
 * @param {object} [options.offset] - Offset to add, from `frameOffset`.
 * @return {Promise<Array>} One rect per match, in document order.
 */
export function measureAll( page, selector, { frame = null, offset = { x: 0, y: 0 } } = {} ) {
	return page.evaluate(
		( [ sel, f, off ] ) => {
			const root = f ? document.querySelector( `iframe[name="${ f }"]` ).contentDocument : document;
			return [ ...root.querySelectorAll( sel ) ].map( el => {
				const r = el.getBoundingClientRect();
				return {
					x: +( r.x + off.x ).toFixed( 1 ),
					y: +( r.y + off.y ).toFixed( 1 ),
					w: +r.width.toFixed( 1 ),
					h: +r.height.toFixed( 1 ),
					text: ( el.innerText || '' ).replace( /\s+/g, ' ' ).trim().slice( 0, 60 ),
				};
			} );
		},
		[ selector, frame, offset ]
	);
}

/*
 * Give an element an id of your own before measuring it.
 *
 * Jetpack admin screens ship CSS-module class names like `J94mUfxvLuP1Gu8JjQdO`
 * that change on every build. Anchor on something stable (an ARIA label), walk to
 * the element you actually want, stamp an id, and use that id everywhere after.
 * @param page
 * @param selector
 * @param id
 * @param climb
 */
/**
 * Give an element an id of your own before measuring it.
 *
 * Jetpack admin screens ship CSS-module class names that change on every build.
 * Anchor on something stable, walk to the element you want, and stamp an id.
 *
 * @param {object} page     - Playwright page.
 * @param {string} selector - Stable selector to anchor on.
 * @param {string} id       - Id to assign.
 * @param {string} [climb]  - Optional ancestor selector to walk up to first.
 * @return {Promise<boolean>} True once stamped.
 */
export const stampId = ( page, selector, id, climb = null ) =>
	page.evaluate(
		( [ sel, newId, up ] ) => {
			const found = document.querySelector( sel );
			if ( ! found ) throw new Error( `stampId: nothing matches ${ sel }` );
			const el = up ? found.closest( up ) : found;
			if ( ! el ) throw new Error( `stampId: ${ sel } has no ancestor matching ${ up }` );
			el.id = newId;
			return true;
		},
		[ selector, id, climb ]
	);

/*
 * PNG -> lossless WebP. Lossless beats lossy for flat UI: smaller AND crisp.
 * @param png
 * @param webp
 * @param root0
 * @param root0.alpha
 */
/**
 * Convert a PNG to lossless WebP, which is both smaller and crisper than lossy for
 * flat UI.
 *
 * @param {string}         png             - Source PNG path.
 * @param {string}         webp            - Destination WebP path.
 * @param {object}         [options]       - Options.
 * @param {boolean|string} [options.alpha] - `auto` keeps alpha when the source has it.
 * @return {string} The destination path.
 */
export function toWebp( png, webp, { alpha = 'auto' } = {} ) {
	// RGB by default: crops are opaque. Pass { alpha: true } for anything captured
	// with omitBackground, or the transparency silently becomes a black box.
	// `auto` keeps alpha only when the source has it. Flattening a transparent crop
	// silently produces an opaque rectangle that covers the plate underneath.
	let mode = 'RGB';
	if ( alpha === 'auto' ) {
		mode = null;
	} else if ( alpha ) {
		mode = 'RGBA';
	}
	try {
		execFileSync(
			'python3',
			[
				'-c',
				`
from PIL import Image
im = Image.open(${ JSON.stringify( png ) })
mode = ${
					mode === null
						? "('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')"
						: JSON.stringify( mode )
				}
im.convert(mode).save(${ JSON.stringify( webp ) }, 'WEBP', lossless=True, quality=100, method=6)
`,
			],
			{ stdio: [ 'ignore', 'ignore', 'pipe' ] }
		);
	} catch ( e ) {
		const err = String( e.stderr || '' );
		if ( /No module named .PIL./.test( err ) ) {
			throw new Error( 'toWebp needs Python Pillow: python3 -m pip install --user Pillow', {
				cause: e,
			} );
		}
		throw new Error( `toWebp failed for ${ png }: ${ err.trim() || e.message }`, { cause: e } );
	}
	return webp;
}

/* Check the tools this kit shells out to, before a capture run spends a JN site. */
/**
 * Check the tools this kit shells out to, before a capture run spends a site.
 *
 * @return {void}
 */
export function preflight() {
	try {
		execFileSync( 'python3', [ '-c', 'import PIL' ], { stdio: 'ignore' } );
	} catch {
		throw new Error( 'Python Pillow is missing: python3 -m pip install --user Pillow' );
	}
}
