#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Rasterize SVG icons into PNG images for use in email templates.
 *
 * Processes two sets of icons:
 * 1. Block field icons: src/blocks/field-* /icon.svg → field-icons/{name}@2x.png
 * 2. File-type icons:   src/contact-form/images/file-icons/*.svg → file-icons/{name}@2x.png
 *
 * All PNGs are 48x48 (2x retina for 24x24 display) with transparent background,
 * palette mode, and max compression for minimal file size.
 *
 * Usage: node tools/rasterize-icons.mjs
 */

import { mkdir, readFile, writeFile } from 'fs/promises';
import { Buffer } from 'node:buffer';
import { basename, dirname, join, relative } from 'path';
import { glob } from 'glob';
import sharp from 'sharp';
import { iconPipelineConfig } from './webpack.config.extract-icons.js';

/**
 * Strip the pHYs chunk from a PNG buffer.
 *
 * Sharp writes a pHYs chunk derived from the input density, which adds 21 bytes
 * per file. WP.com Simple's image optimization cron strips this by running
 * `optipng -strip all`, so let's match that effect.
 *
 * See also: https://www.w3.org/TR/PNG-Structure.html
 *
 * @param {Buffer} b - PNG buffer to strip.
 * @return {Buffer} Buffer with the pHYs chunk removed.
 */
function stripPhysChunk( b ) {
	const parts = [ b.subarray( 0, 8 ) ];
	let i = 8;
	while ( i < b.length ) {
		const len = b.readUInt32BE( i );
		const type = b.toString( 'ascii', i + 4, i + 8 );
		const end = i + 8 + len + 4;
		if ( type !== 'pHYs' ) {
			parts.push( b.subarray( i, end ) );
		}
		i = end;
	}
	return Buffer.concat( parts );
}

const {
	formsRoot,
	blocksDir,
	blockDirPattern,
	svgFilename,
	rasterOutputDir: outputDir,
	rasterSuffix,
	fileIconsDir,
} = iconPipelineConfig;

/**
 * Rasterize a single SVG file to PNG.
 *
 * @param {string} svgFile    - Absolute path to the SVG source.
 * @param {string} outputFile - Absolute path for the PNG output.
 * @return {boolean} True on success, false on failure.
 */
async function rasterize( svgFile, outputFile ) {
	const relativePath = relative( formsRoot, outputFile );
	try {
		const svgContent = await readFile( svgFile, 'utf8' );
		const svgBuffer = Buffer.from( svgContent.replace( /currentColor/g, '#000' ) );

		// Density 144 renders the 24×24 viewBox natively at 48px (24 × 144/72),
		// avoiding the blur from rasterizing at a smaller size and upscaling.
		const pngBuffer = await sharp( svgBuffer, { density: 144 } )
			.png( {
				compressionLevel: 9,
				palette: true,
				colors: 16,
			} )
			.toBuffer();

		await writeFile( outputFile, stripPhysChunk( pngBuffer ) );

		console.log( `  ✓ ${ relativePath }` );
		return true;
	} catch ( err ) {
		console.error( `  ✗ ${ relativePath }: ${ err.message }` );
		return false;
	}
}

let totalProcessed = 0;
let totalFailed = 0;

// --- Block field icons (src/blocks/field-*/icon.svg) -------------------------

const blockSvgFiles = await glob( join( blocksDir, blockDirPattern, svgFilename ) );

if ( blockSvgFiles.length > 0 ) {
	console.log( `Found ${ blockSvgFiles.length } block icon(s). Rasterizing...\n` );
	await mkdir( outputDir, { recursive: true } );

	for ( const svgFile of blockSvgFiles ) {
		const blockName = basename( dirname( svgFile ) );
		const outputFile = join( outputDir, `${ blockName }${ rasterSuffix }.png` );
		const ok = await rasterize( svgFile, outputFile );
		totalProcessed++;
		if ( ! ok ) {
			totalFailed++;
		}
	}
}

// --- File-type icons (src/contact-form/images/file-icons/*.svg) --------------

const fileIconSvgs = await glob( join( fileIconsDir, '*.svg' ) );

if ( fileIconSvgs.length > 0 ) {
	console.log( `\nFound ${ fileIconSvgs.length } file-type icon(s). Rasterizing...\n` );
	await mkdir( fileIconsDir, { recursive: true } );

	for ( const svgFile of fileIconSvgs ) {
		const name = basename( svgFile, '.svg' );
		const outputFile = join( fileIconsDir, `${ name }${ rasterSuffix }.png` );
		const ok = await rasterize( svgFile, outputFile );
		totalProcessed++;
		if ( ! ok ) {
			totalFailed++;
		}
	}
}

// --- Summary -----------------------------------------------------------------

if ( totalProcessed > 0 ) {
	console.log( `\nDone: ${ totalProcessed - totalFailed } converted, ${ totalFailed } failed.` );
	if ( totalFailed > 0 ) {
		throw new Error( `${ totalFailed } icon(s) failed to convert.` );
	}
} else {
	console.log( 'No SVG icons found.' );
}
