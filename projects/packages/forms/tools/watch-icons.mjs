#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Watch icon source files and re-run the extract → rasterize pipeline on changes.
 *
 * Monitors src/blocks/field-* /icon.{jsx,tsx,js} for modifications and triggers
 * a debounced pipeline run. Intended to be included in the `watch` concurrently
 * command so icon PNGs stay up-to-date during development.
 *
 * Uses per-directory fs.watch (no recursive flag) for cross-platform support
 * (macOS, Linux, Windows). Each field-* block directory gets its own watcher
 * that filters events to icon source filenames only.
 *
 * Usage: node tools/watch-icons.mjs
 */

import { spawn } from 'child_process';
import { watch } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import { iconPipelineConfig } from './webpack.config.extract-icons.js';

const __dirname = import.meta.dirname;
const { blocksDir, blockDirPattern, iconFilenames } = iconPipelineConfig;

const iconBasenameSet = new Set( iconFilenames );

let debounceTimer = null;
let running = false;
let queued = false;

/**
 * Spawn a Node script and return a promise that resolves with the exit code.
 *
 * @param {string} script - Script filename inside tools/.
 * @return {Promise<number>} Exit code.
 */
function run( script ) {
	return new Promise( resolve => {
		const child = spawn( 'node', [ join( __dirname, script ) ], {
			cwd: join( __dirname, '..' ),
			stdio: 'inherit',
		} );
		child.on( 'close', resolve );
		child.on( 'error', () => resolve( 1 ) );
	} );
}

/**
 * Run the icon pipeline.
 */
async function runPipeline() {
	if ( running ) {
		queued = true;
		return;
	}
	running = true;

	console.log( '\n[watch:icons] Running icon pipeline...\n' );

	const extractCode = await run( 'extract-icons.mjs' );
	if ( extractCode !== 0 ) {
		console.error( '[watch:icons] extract-icons failed — skipping rasterize.' );
	} else {
		const rasterCode = await run( 'rasterize-icons.mjs' );
		if ( rasterCode !== 0 ) {
			console.error( '[watch:icons] rasterize-icons failed.' );
		} else {
			console.log( '\n[watch:icons] Done. Watching for changes...' );
		}
	}

	running = false;
	if ( queued ) {
		queued = false;
		runPipeline();
	}
}

// --- Start watching ---------------------------------------------------------

// Discover all field-* block directories and watch each one individually.
// Per-directory fs.watch (without recursive) works on macOS, Linux, and Windows.
const blockDirs = await glob( join( blocksDir, blockDirPattern ), { posix: false } );

if ( blockDirs.length === 0 ) {
	console.log( '[watch:icons] No block directories found — nothing to watch.' );
} else {
	console.log(
		`[watch:icons] Watching ${ blockDirs.length } block directories for icon changes...`
	);

	for ( const dir of blockDirs ) {
		watch( dir, ( _event, filename ) => {
			if ( ! filename || ! iconBasenameSet.has( filename ) ) {
				return;
			}

			console.log( `[watch:icons] Changed: ${ filename }` );

			clearTimeout( debounceTimer );
			debounceTimer = setTimeout( runPipeline, 300 );
		} );
	}
}
