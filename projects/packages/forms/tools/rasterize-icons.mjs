#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Rasterize SVG block icons into PNG images for use in email templates.
 *
 * Finds all icon.svg files in src/blocks/field-* directories and converts
 * them to 48x48 PNG files (2x retina for 24x24 display) with white background.
 * Uses palette mode and max compression for minimal file size.
 *
 * Usage: node tools/rasterize-icons.mjs
 */

import { unlink } from 'fs/promises';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import sharp from 'sharp';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const blocksDir = join( __dirname, '..', 'src', 'blocks' );

const svgFiles = await glob( join( blocksDir, 'field-*', 'icon.svg' ) );

if ( svgFiles.length > 0 ) {
	console.log( `Found ${ svgFiles.length } SVG icons. Rasterizing...\n` );

	let failed = 0;

	for ( const svgFile of svgFiles ) {
		const blockDir = dirname( svgFile );
		const outputFile = join( blockDir, 'icon@2x.png' );
		const oldJpgFile = join( blockDir, 'icon@2x.jpg' );
		const relativePath = relative( join( __dirname, '..' ), outputFile );

		try {
			await sharp( svgFile, { density: 96 } )
				.resize( 48, 48 )
				.flatten( { background: '#ffffff' } )
				.png( {
					compressionLevel: 9,
					palette: true,
					colors: 16,
				} )
				.toFile( outputFile );

			// Remove legacy JPG if it exists
			try {
				await unlink( oldJpgFile );
			} catch {
				// Ignore if file doesn't exist
			}

			console.log( `  ✓ ${ relativePath }` );
		} catch ( err ) {
			console.error( `  ✗ ${ relativePath }: ${ err.message }` );
			failed++;
		}
	}

	console.log( `\nDone: ${ svgFiles.length - failed } converted, ${ failed } failed.` );

	if ( failed > 0 ) {
		throw new Error( `${ failed } icon(s) failed to convert.` );
	}
} else {
	console.log( 'No SVG icons found.' );
}
