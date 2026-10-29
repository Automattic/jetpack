#!/usr/bin/env node
// Copies every WebP/PNG under `routes/` into `build/images/` for `assetUrl()`; wp-build's esbuild has no image loader.
import { cp, glob, mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join( import.meta.dirname, '..' );
const SOURCE = path.join( ROOT, 'routes' );
const DEST = path.join( ROOT, 'build/images' );

for await ( const file of glob( '**/*.{webp,png}', { cwd: SOURCE } ) ) {
	const target = path.join( DEST, file );
	await mkdir( path.dirname( target ), { recursive: true } );
	await cp( path.join( SOURCE, file ), target );
}
