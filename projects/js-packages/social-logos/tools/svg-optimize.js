#!/usr/bin/env node
/* eslint-disable no-console */
const srcSvgDir = 'src/svg';
const destSvgDir = 'build/svg-clean';

const fs = require( 'fs' );
const path = require( 'path' );
const process = require( 'process' );
const { glob } = require( 'glob' );
const { optimize } = require( 'svgo' );

const svgo_config = {
	js2svg: { finalNewline: true }, // force EOF newline
	plugins: [
		{
			name: 'preset-default',
			params: {
				overrides: {},
			},
		},
		{
			name: 'removeAttrs',
			params: {
				attrs: [ 'style', 'xml:space', 'id', 'fill' ],
				elemSeparator: '!',
			},
		},
		{
			name: 'addAttributesToSVGElement',
			params: {
				attributes: [ { viewBox: '0 0 24 24' }, { xmlns: 'http://www.w3.org/2000/svg' } ],
			},
		},
	],
};

// Start in the right folder.
const rootDir = __dirname + '/..';
process.chdir( rootDir );

// Make destination dir as needed.
fs.mkdirSync( destSvgDir, { recursive: true } );

const srcFiles = glob.sync( srcSvgDir + '/*.svg' ).sort();
for ( const srcFile of srcFiles ) {
	const data = fs.readFileSync( srcFile, 'utf8' );
	let optimizedData = optimize( data, {
		path: srcFile, // recommended by library for use by its plugins
		...svgo_config,
	} )?.data;

	if ( ! optimizedData ) {
		throw Error( `Unable to optimize '${ srcFile }'!` );
	}
	const destFile = destSvgDir + '/' + path.basename( srcFile );

	// Add <g> to SVG innards.
	optimizedData = optimizedData.replace( /(>)(.*)(<\/svg>)/, '$1<g>$2</g>$3' );
	fs.writeFileSync( destFile, optimizedData );
}

console.log( `Created optimized SVGs in '${ destSvgDir }'.` );
