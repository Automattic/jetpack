#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Rasterize SVG block icons into PNG images for use in email templates.
 *
 * Finds all icon.svg files in src/blocks/field-* directories and converts
 * them to 48x48 PNG files (2x retina for 24x24 display) with white background,
 * output to src/contact-form/images/field-icons/. Uses palette mode and max
 * compression for minimal file size.
 *
 * Usage: node tools/rasterize-icons.mjs
 */

import { mkdir } from 'fs/promises';
import { basename, dirname, join, relative } from 'path';
import { glob } from 'glob';
import sharp from 'sharp';
import { iconPipelineConfig } from './webpack.config.extract-icons.js';

const {
	formsRoot,
	blocksDir,
	blockDirPattern,
	svgFilename,
	rasterOutputDir: outputDir,
	rasterSuffix,
} = iconPipelineConfig;

// Find all SVG icon files matching the configured block pattern.
const svgFiles = await glob( join( blocksDir, blockDirPattern, svgFilename ) );

if ( svgFiles.length > 0 ) {
	console.log( `Found ${ svgFiles.length } SVG icons. Rasterizing...\n` );

	await mkdir( outputDir, { recursive: true } );

	let failed = 0;

	for ( const svgFile of svgFiles ) {
		const blockName = basename( dirname( svgFile ) );
		const outputFile = join( outputDir, `${ blockName }${ rasterSuffix }.png` );
		const relativePath = relative( formsRoot, outputFile );

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
