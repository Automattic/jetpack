#!/usr/bin/env node

/* eslint no-console: 0 */

const fs = require( 'fs' );
const path = require( 'path' );
const execSync = require( 'child_process' ).execSync;

const blocks = [
	'hello-dolly/hello-block.js',
	// 'jetpack/tiled-gallery/tiled-gallery.jsx',
];

const outputDir = path.resolve( '_inc/build/blocks' );

if ( ! fs.existsSync( outputDir ) ) {
	fs.mkdirSync( outputDir );
}

console.log( 'Building Gutenberg blocks...' );

blocks.forEach( block => {
	console.log( `Building ${ block }` );
	// Relative to wp-calypso
	const inputFile = path.join( 'client/gutenberg/extensions/', block );
	execSync( `npx calypso-gutenberg-sdk build-block ${ inputFile } ${ outputDir }`, {
		shell: true,
		stdio: 'inherit',
	} );
} );
