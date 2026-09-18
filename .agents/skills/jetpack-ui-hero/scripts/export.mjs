#!/usr/bin/env node
/* global process */
/* eslint-disable no-console, n/no-process-exit -- a CLI: stdout is the interface and the exit code is the result. */
/*
 * Export a built hero piece to MP4 / WebM / GIF.
 *
 * The animation stays the deliverable for the web — it is text, it is 20-90 KB, and
 * it respects reduced motion. Export when the destination cannot take HTML: a deck,
 * a Slack post, a GitHub comment.
 *
 * Frames are captured by SEEKING, not by recording, so the output is identical on
 * any machine regardless of how fast it renders.
 *
 * Usage:
 *   export.mjs <index.html> [box-id] [options]
 *     --all               export every piece on the page (default when no box-id)
 *     --duration 9        seconds (default: measured from the timeline + --hold)
 *     --hold 2.5          seconds to sit on the final frame (default 2.5)
 *     --fps 25            frames per second (default 25; GIF alone forces 15)
 *     --width 1280        output width in px (default: the scene's own width)
 *     --format mp4,gif    comma-separated: mp4, webm, gif (default mp4)
 *     --out hero          basename, or prefix when exporting several
 *     --outDir .          where to write (default: alongside index.html)
 *     --keep-frames       leave the PNG frames behind for inspection
 *
 * MP4 is the default because it is 4-8x smaller than the same piece as a GIF and
 * holds full colour. Ask for gif only where the destination cannot play video.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { open, sleep } from './capture-kit.mjs';

// Parse properly: naively filtering out `--x` leaves each flag's VALUE looking
// like a positional, so `--format mp4` was being read as the box id.
const BOOLEAN = new Set( [ 'all', 'keep-frames' ] );
const argv = process.argv.slice( 2 );
const opts = {};
const positional = [];
for ( let i = 0; i < argv.length; i++ ) {
	const a = argv[ i ];
	if ( ! a.startsWith( '--' ) ) {
		positional.push( a );
		continue;
	}
	const name = a.slice( 2 );
	if ( BOOLEAN.has( name ) ) {
		opts[ name ] = true;
		continue;
	}
	const next = argv[ i + 1 ];
	if ( next === undefined || next.startsWith( '--' ) ) {
		opts[ name ] = true;
		continue;
	}
	opts[ name ] = next;
	i++;
}
const [ file, box ] = positional;
const flag = ( name, fallback ) => ( name in opts ? opts[ name ] : fallback );
if ( ! file ) {
	console.error(
		'usage: export.mjs <index.html> [box-id] [--all] [--format mp4,gif] [--width 1280] [--out name]'
	);
	process.exit( 1 );
}
if ( ! existsSync( file ) ) {
	console.error( `no such file: ${ file }` );
	process.exit( 1 );
}
try {
	execFileSync( 'ffmpeg', [ '-version' ], { stdio: 'ignore' } );
} catch {
	console.error( 'ffmpeg is not installed: brew install ffmpeg' );
	process.exit( 1 );
}

const durationFlag = flag( 'duration', null );
const hold = Number( flag( 'hold', 2.5 ) );
const formats = String( flag( 'format', 'mp4' ) )
	.split( ',' )
	.map( s => s.trim() )
	.filter( Boolean );
const base = flag( 'out', null );
const outDir = resolve( String( flag( 'outDir', dirname( resolve( file ) ) ) ) );
const keep = !! flag( 'keep-frames', false );
mkdirSync( outDir, { recursive: true } );

const url = pathToFileURL( resolve( file ) ).href;
const frameDir = mkdtempSync( join( tmpdir(), 'hero-frames-' ) );

const { browser, page } = await open( { width: 1600, height: 1400, scale: 2 } );
const outputs = [];
try {
	await page.goto( url, { waitUntil: 'networkidle' } );
	await sleep( 1500 );
	await page.evaluate( () =>
		document.querySelectorAll( '.stage, .jph' ).forEach( s => s.classList.remove( 'is-idle' ) )
	);
	await sleep( 300 );

	// Which pieces to export, and what to call each file.
	const pieces = await page.evaluate( wanted => {
		const slug = s =>
			s
				.toLowerCase()
				.replace( /[^a-z0-9]+/g, '-' )
				.replace( /^-|-$/g, '' );
		const boxes = [ ...document.querySelectorAll( '[id$="-box"]' ) ].filter( b =>
			b.querySelector( '.scene, .jph-scene' )
		);
		return boxes
			.filter( b => ! wanted || b.id === wanted )
			.map( b => {
				const scene = b.querySelector( '.scene, .jph-scene' );
				const heading = b.closest( 'section' )?.querySelector( 'h2' )?.textContent?.trim();
				return {
					box: b.id,
					name: heading ? slug( heading ) : b.id.replace( /-box$/, '' ),
					w: scene.offsetWidth,
				};
			} );
	}, box || null );

	if ( ! pieces.length ) {
		const ids = await page.evaluate( () =>
			[ ...document.querySelectorAll( '[id$="-box"]' ) ].map( b => b.id )
		);
		console.error( box ? `no element #${ box }.` : 'no pieces found on this page.' );
		console.error( `Boxes on this page: ${ ids.join( ', ' ) || '(none)' }` );
		process.exit( 1 );
	}
	const bad = pieces.find( p => ! p.w );
	if ( bad ) {
		console.error( `#${ bad.box }: the scene has no width — run scrub.mjs` );
		process.exit( 1 );
	}

	const gifOnly = formats.length === 1 && formats[ 0 ] === 'gif';
	const fps = Number( flag( 'fps', gifOnly ? 15 : 25 ) );
	const run = args =>
		execFileSync( 'ffmpeg', [ '-y', '-hide_banner', '-loglevel', 'error', ...args ], {
			stdio: 'inherit',
		} );

	for ( const piece of pieces ) {
		// How long the piece actually runs: the last beat to finish, plus a hold.
		// Guessing this is the most common way an export ends up truncated.
		const measured = await page.evaluate( id => {
			const root = document.getElementById( id );
			let end = 0;
			for ( const a of document.getAnimations() ) {
				const target = a.effect?.target;
				if ( ! target || ! root.contains( target ) ) continue;
				const t = a.effect.getComputedTiming();
				if ( ! Number.isFinite( t.iterations ) ) continue; // skip infinite blinks
				const finish = ( t.delay || 0 ) + ( t.activeDuration || 0 );
				if ( Number.isFinite( finish ) ) end = Math.max( end, finish );
			}
			return end / 1000;
		}, piece.box );
		const duration =
			durationFlag !== null ? Number( durationFlag ) : Math.max( measured + hold, 2 );
		const width = Math.round( Number( flag( 'width', piece.w ) ) / 2 ) * 2; // h264 needs even dimensions
		const total = Math.round( duration * fps );
		let stem = piece.name;
		if ( base ) {
			stem = pieces.length > 1 ? `${ base }-${ piece.name }` : String( base );
		}

		console.log(
			`${ piece.name }: ${ duration.toFixed( 1 ) }s (last beat ${ measured.toFixed(
				1
			) }s + ${ hold }s hold), ` +
				`${ total } frames at ${ fps }fps, ${ piece.w }px -> ${ width }px`
		);

		rmSync( frameDir, { recursive: true, force: true } );
		mkdirSync( frameDir, { recursive: true } );
		const loc = page.locator( '#' + piece.box );
		for ( let i = 0; i < total; i++ ) {
			await page.evaluate(
				ms =>
					document.getAnimations().forEach( a => {
						a.pause();
						a.currentTime = ms;
					} ),
				( i / fps ) * 1000
			);
			await loc.screenshot( {
				path: join( frameDir, `f_${ String( i ).padStart( 5, '0' ) }.png` ),
			} );
		}

		const input = [ '-framerate', String( fps ), '-i', join( frameDir, 'f_%05d.png' ) ];
		for ( const fmt of formats ) {
			const out = join( outDir, `${ stem }.${ fmt }` );
			if ( fmt === 'mp4' ) {
				run( [
					...input,
					'-vf',
					`scale=${ width }:-2:flags=lanczos`,
					'-c:v',
					'libx264',
					'-pix_fmt',
					'yuv420p',
					'-crf',
					'20',
					'-movflags',
					'+faststart',
					out,
				] );
			} else if ( fmt === 'webm' ) {
				run( [
					...input,
					'-vf',
					`scale=${ width }:-2:flags=lanczos`,
					'-c:v',
					'libvpx-vp9',
					'-crf',
					'32',
					'-b:v',
					'0',
					'-row-mt',
					'1',
					out,
				] );
			} else if ( fmt === 'gif' ) {
				// One shared palette beats per-frame quantisation on flat UI, and bayer
				// dithering keeps large flat areas from crawling between frames.
				run( [
					...input,
					'-vf',
					`scale=${ width }:-2:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=192:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3`,
					'-loop',
					'0',
					out,
				] );
			} else {
				console.error( `unknown format: ${ fmt }` );
				continue;
			}
			outputs.push( out );
		}
	}
} finally {
	await browser.close();
	if ( keep ) console.log( `frames kept in ${ frameDir }` );
	else rmSync( frameDir, { recursive: true, force: true } );
}

const { statSync } = await import( 'node:fs' );
for ( const o of outputs )
	console.log( `${ o } — ${ Math.round( statSync( o ).size / 1024 ) } KB` );
if ( outputs.some( o => o.endsWith( '.gif' ) ) ) {
	console.log(
		'note: GIF is 256 colours and has no alpha; prefer mp4 wherever the destination allows it'
	);
}
