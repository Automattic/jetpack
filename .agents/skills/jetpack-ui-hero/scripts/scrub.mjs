#!/usr/bin/env node
/* global process */
/* eslint-disable no-console, n/no-process-exit -- a CLI verifier: stdout is the interface and the exit code is the result. */
/*
 * Verify a built hero page by scrubbing its timeline, instead of watching it.
 *
 * Pauses every animation, seeks to each time and screenshots the scene box; also
 * renders the whole page (so the shell, spec table and footer get looked at), the
 * reduced-motion state — which MUST match the final frame — and phone width.
 *
 * Usage: scrub.mjs <index.html> <box-id> [times] [outDir]
 *        scrub.mjs build/index.html fr-box 0.5,2.4,5.7,8.5 frames
 *
 * Run it once per piece. Pick times either side of every beat, plus one after the
 * last, rather than reusing the defaults — they assume a ~9s piece.
 */
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { sleep, playwright } from './capture-kit.mjs';

const [ file, box, timesArg = '0.5,3,6,8.5', outDir = 'frames' ] = process.argv.slice( 2 );
if ( ! file || ! box ) {
	console.error( 'usage: scrub.mjs <index.html> <box-id> [times] [outDir]' );
	process.exit( 1 );
}
const times = timesArg.split( ',' ).map( t => Number( String( t ).trim().replace( /s$/, '' ) ) );
if ( ! times.length || ! times.every( Number.isFinite ) ) {
	console.error( `bad times: "${ timesArg }" — comma-separated seconds, e.g. 0.5,2.4,5.7` );
	process.exit( 1 );
}
// A '#' in the path becomes a fragment if the URL is built by concatenation.
const url = pathToFileURL( resolve( file ) ).href;
mkdirSync( outDir, { recursive: true } );

const seek = ( page, ms ) =>
	page.evaluate(
		t =>
			document.getAnimations().forEach( a => {
				a.pause();
				a.currentTime = t;
			} ),
		ms
	);
const start = page =>
	page.evaluate( () =>
		document.querySelectorAll( '.stage' ).forEach( s => s.classList.remove( 'is-idle' ) )
	);

const errors = [];
const watch = ( page, label ) => {
	page.on( 'pageerror', e => errors.push( `${ label }: ${ e.message }` ) );
	return page;
};

const { chromium } = await playwright();
const browser = await chromium.launch();
let failed = false;
try {
	const ctx = await browser.newContext( {
		viewport: { width: 1400, height: 1300 },
		deviceScaleFactor: 2,
	} );
	const page = watch( await ctx.newPage(), 'timeline' );
	await page.goto( url, { waitUntil: 'networkidle' } );
	await sleep( 1800 );
	await start( page );
	await sleep( 300 );

	const scenes = await page.evaluate( () =>
		[ ...document.querySelectorAll( '.scene' ) ].map( s => s.id )
	);
	console.log( 'scenes:', scenes );
	if ( ( await page.locator( '#' + box ).count() ) === 0 ) {
		console.error(
			`no element #${ box }. Scenes on this page: ${ scenes.join( ', ' ) || '(none)' }`
		);
		console.error( 'the box id is the scene id with -scene swapped for -box' );
		process.exit( 1 );
	}

	// A scene with no width scales to Infinity, which CSS drops silently; the page
	// then renders at 1:1 in a corner and every frame below looks merely wrong.
	const sized = await page.evaluate( id => {
		const b = document.getElementById( id ),
			s = b.querySelector( '.scene' );
		return { w: s.offsetWidth, h: s.offsetHeight, transform: getComputedStyle( s ).transform };
	}, box );
	if ( ! sized.w || ! sized.h || sized.transform === 'none' ) {
		console.error(
			`#${ box }: scene measures ${ sized.w }x${ sized.h }, transform "${ sized.transform }".`
		);
		console.error( 'The scene needs explicit width/height. build-page.py emits them from the' );
		console.error(
			'manifest width/height — check those are set and that no piece CSS overrides them.'
		);
		failed = true;
	}

	let finalFrame = null;
	for ( const t of times ) {
		await seek( page, t * 1000 );
		await sleep( 220 );
		const shot = await page
			.locator( '#' + box )
			.screenshot( { path: `${ outDir }/${ box }-${ String( t ).replace( '.', '_' ) }.png` } );
		if ( t === Math.max( ...times ) ) finalFrame = shot;
	}
	// the whole page once, so the shell is actually looked at
	await page.screenshot( { path: `${ outDir }/page.png`, fullPage: true } );

	// reduced motion must land on the final frame, not somewhere mid-timeline
	const rmCtx = await browser.newContext( {
		viewport: { width: 1400, height: 1300 },
		deviceScaleFactor: 2,
		reducedMotion: 'reduce',
	} );
	const rm = watch( await rmCtx.newPage(), 'reduced-motion' );
	await rm.goto( url, { waitUntil: 'networkidle' } );
	await start( rm );
	await sleep( 1200 );
	const rmFrame = await rm
		.locator( '#' + box )
		.screenshot( { path: `${ outDir }/${ box }-reduced-motion.png` } );

	// The invariant, actually checked: reduced motion must land on the final frame.
	// If it does not, some animation is missing `both` fill or runs infinitely.
	if ( finalFrame && ! rmFrame.equals( finalFrame ) ) {
		console.error( `reduced motion does NOT match the last frame (t=${ Math.max( ...times ) }).` );
		console.error(
			`compare ${ outDir }/${ box }-reduced-motion.png against ${ outDir }/${ box }-${ String(
				Math.max( ...times )
			).replace( '.', '_' ) }.png`
		);
		console.error(
			'usual cause: an animation without `both` fill, or an infinite one that needs disabling'
		);
		failed = true;
	} else if ( finalFrame ) {
		console.log( 'reduced motion matches the final frame' );
	}

	// phone width: nothing may scroll sideways
	const mob = await browser.newContext( {
		viewport: { width: 390, height: 900 },
		deviceScaleFactor: 2,
	} );
	const mp = watch( await mob.newPage(), 'phone' );
	await mp.goto( url, { waitUntil: 'networkidle' } );
	await sleep( 1200 );
	const over = await mp.evaluate( () => ( {
		doc: document.documentElement.scrollWidth,
		win: innerWidth,
	} ) );
	const ok = over.doc <= over.win;
	console.log( 'phone width:', JSON.stringify( over ), ok ? 'OK' : 'OVERFLOWS' );
	if ( ! ok ) failed = true;

	console.log( 'errors:', errors.length ? errors.slice( 0, 6 ) : 'none' );
	if ( errors.length ) failed = true;
	console.log( `frames in ${ outDir }/ — look at page.png for the shell, spec table and footer` );
} finally {
	await browser.close();
}
process.exit( failed ? 1 : 0 );
