#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Rasterize SVG block icons into PNG images for use in email templates.
 *
 * Finds all icon.svg files in src/blocks/field-* directories and converts
 * them to 48x48 PNG files (2x retina for 24x24 display) with transparent background,
 * output to src/contact-form/images/field-icons/. Uses palette mode and max
 * compression for minimal file size.
 *
 * Usage: node tools/rasterize-icons.mjs
 */

import { mkdir, readFile } from 'fs/promises';
import { Buffer } from 'node:buffer';
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
			// Replace currentColor with black — PNGs need a concrete fill value.
			const svgContent = await readFile( svgFile, 'utf8' );
			const svgBuffer = Buffer.from( svgContent.replace( /currentColor/g, '#000' ) );

			// Density 144 renders the 24×24 viewBox natively at 48px (24 × 144/72),
			// avoiding the blur from rasterizing at a smaller size and upscaling.
			await sharp( svgBuffer, { density: 144 } )
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
