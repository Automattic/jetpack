#!/usr/bin/env node
/* eslint-disable no-console */
const svgDir = 'build/svg-clean';
const srcExampleHTML = 'src/svg-sprite/example.html';
const srcExampleCSS = 'src/css/example.css';
const destSpriteDir = 'build/svg-sprite';
const destSpriteFilename = `${ destSpriteDir }/social-logos.svg`;

const fs = require( 'fs' );
const path = require( 'path' );
const process = require( 'process' );
const { glob } = require( 'glob' );
const svgstore = require( 'svgstore' );

// Start in the right folder.
const rootDir = __dirname + '/..';
process.chdir( rootDir );

// Make destination dir as needed.
fs.mkdirSync( destSpriteDir, { recursive: true } );

// Generate SVG.
const sprites = svgstore( { inline: true } );
const files = glob.sync( svgDir + '/*.svg' ).sort();
for ( const file of files ) {
	sprites.add( path.basename( file, '.svg' ), fs.readFileSync( file, 'utf8' ) );
}

const svgText = sprites
	.toString()
	// Make SVG more conformant.
	.replace( '<svg><defs/>', '<svg xmlns="http://www.w3.org/2000/svg">' );

fs.writeFileSync( destSpriteFilename, svgText, 'utf8' );

// Copy example files.
fs.cpSync( `${ srcExampleHTML }`, `${ destSpriteDir }/example.html` );
fs.cpSync( `${ srcExampleCSS }`, `${ destSpriteDir }/example.css` );

// Inject SVG into example file.
fs.writeFileSync(
	`${ destSpriteDir }/example.html`,
	fs.readFileSync( `${ destSpriteDir }/example.html`, 'utf8' ).replace( '{{SVG_HERE}}', svgText ),
	'utf8'
);

console.log( `Created SVG sprite file in '${ destSpriteDir }'` );
