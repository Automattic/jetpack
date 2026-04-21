#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Rasterize SVG icons into WebP images for use in email templates.
 *
 * Processes two sets of icons:
 * 1. Block field icons: src/blocks/field-* /icon.svg → field-icons/{name}@2x.webp
 * 2. File-type icons:   src/contact-form/images/file-icons/*.svg → file-icons/{name}@2x.webp
 *
 * All WebPs are 48x48 (2x retina for 24x24 display) with a transparent background.
 * The SVG is first rendered to a 16-colour palette PNG buffer, then re-encoded
 * as lossless WebP, saving ~30% vs. direct SVG → WebP for simple icons.
 *
 * Usage: node tools/rasterize-icons.mjs
 */

import { mkdir, readFile, writeFile } from 'fs/promises';
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
	fileIconsDir,
} = iconPipelineConfig;

/**
 * Rasterize a single SVG file to WebP.
 *
 * @param {string} svgFile    - Absolute path to the SVG source.
 * @param {string} outputFile - Absolute path for the WebP output.
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
			.png( { palette: true, colors: 16 } )
			.toBuffer();

		const webpBuffer = await sharp( pngBuffer ).webp( { lossless: true, effort: 6 } ).toBuffer();

		await writeFile( outputFile, webpBuffer );

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
		const outputFile = join( outputDir, `${ blockName }${ rasterSuffix }.webp` );
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
		const outputFile = join( fileIconsDir, `${ name }${ rasterSuffix }.webp` );
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
