#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Rasterize SVG block icons into JPG images for use in email templates.
 *
 * Finds all icon.svg files in src/blocks/field-* directories and converts
 * them to 48x48 JPG files (2x retina for 24x24 display) with white background.
 *
 * Usage: node tools/rasterize-icons.mjs
 */

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
		const outputFile = join( dirname( svgFile ), 'icon@2x.jpg' );
		const relativePath = relative( join( __dirname, '..' ), outputFile );

		try {
			await sharp( svgFile, { density: 96 } )
				.resize( 48, 48 )
				.flatten( { background: '#ffffff' } )
				.jpeg( { quality: 90 } )
				.toFile( outputFile );

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
