#!/usr/bin/env node
/**
 * Copies every WebP/PNG under `_inc/` into `build/images/`, preserving the
 * path relative to `_inc/` so `assetUrl()` can address them predictably.
 *
 * webpack already emits these under content-hashed names the wp-build stage
 * cannot predict, so its output is not reusable here.
 */
import { cp, glob, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join( import.meta.dirname, '..' );
const SOURCE = path.join( ROOT, '_inc' );
const DEST = path.join( ROOT, 'build/images' );

for await ( const file of glob( '**/*.{webp,png}', { cwd: SOURCE } ) ) {
	const target = path.join( DEST, file );
	await mkdir( path.dirname( target ), { recursive: true } );
	await cp( path.join( SOURCE, file ), target );
}
