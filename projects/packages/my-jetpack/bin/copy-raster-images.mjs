#!/usr/bin/env node
/**
 * Copies every WebP/PNG under `_inc/` into `build/images/`, preserving the path
 * relative to `_inc/` so `assetUrl()` can address them predictably.
 *
 * wp-build's esbuild pipeline has no image loader, and webpack's own output is
 * content-hashed to names the wp-build stage cannot predict.
 */
import { cp, glob, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join( import.meta.dirname, '..' );
const SOURCE = path.join( ROOT, '_inc' );
const DEST = path.join( ROOT, 'build/images' );

for await ( const file of glob( '**/*.{webp,png}', { cwd: SOURCE } ) ) {
	// Storybook fixtures are reachable from `_inc/` but never from the app.
	if ( file.split( path.sep ).includes( 'stories' ) ) {
		continue;
	}

	const target = path.join( DEST, file );
	await mkdir( path.dirname( target ), { recursive: true } );
	await cp( path.join( SOURCE, file ), target );
}
