#!/usr/bin/env node
/* eslint-disable no-console */
const svgDir = 'build/svg-clean';
const srcSvgDir = 'src/svg';
const codepointsFile = 'src/font/codepoints.json';
const destFontDir = 'build/font';
const cssFile = destFontDir + '/social-logos.css';
const woff2FontFile = destFontDir + '/social-logos.woff2';

const { spawnSync } = require( 'child_process' );
const fs = require( 'fs' );
const path = require( 'path' );
const process = require( 'process' );
const { glob } = require( 'glob' );
const svg2ttf = require( 'svg2ttf' );
const SVGIcons2SVGFontStream = require( 'svgicons2svgfont' );
const wawoff2 = require( 'wawoff2' );

// Start in the right folder.
const rootDir = __dirname + '/..';
process.chdir( rootDir );

const getCodepoint = name => {
	// If a codepoint for this name does not yet exist, create one.
	if ( ! codepoints[ name ] ) {
		maxCodepoint++;
		codepoints[ name ] = maxCodepoint;
	}
	// Return codepoint.
	return codepoints[ name ];
};

const writeCodepoints = () => {
	fs.writeFile(
		codepointsFile,
		JSON.stringify( codepoints, null, '\t' ) + '\n',
		{ encoding: 'utf8' },
		err => {
			if ( err ) {
				throw err;
			}
			// console.log('Wrote codepoints file.');
			fs.copyFileSync( codepointsFile, destFontDir + '/codepoints.json' );
		}
	);
};

const svg2woff2 = async fontBuffer => {
	// Grab timestamp of last commit that affected the source SVG folder. TTFs
	// store timestamp as per spec, and svg2ttf has an override we can use to
	// prevent generating a slightly different font file on each run.
	const last_svg_commit_timestamp = spawnSync( 'git', [
		'log',
		'-1',
		'--first-parent',
		'--format=%ct',
		srcSvgDir,
	] )
		.stdout.toString()
		.trim();

	const ttf = svg2ttf( fontBuffer.toString(), { ts: last_svg_commit_timestamp } );
	const woff2Data = await wawoff2.compress( ttf.buffer );
	fs.writeFileSync( woff2FontFile, woff2Data );
	// console.log('WOFF2 font created.');
	return Buffer.from( woff2Data );
};

const generateCSS = woff2Buffer => {
	const base64Font = Buffer.from( woff2Buffer ).toString( 'base64' );

	let cssCodepoints = '';
	for ( const name in codepoints ) {
		cssCodepoints += name + ': \\' + codepoints[ name ].toString( 16 ) + '\n';
	}
	const cssContent = `/* This is a generated file. Do not edit. */
@font-face {
	font-family: 'social-logos';
	src: url(
		data:application/octet-stream;base64,${ base64Font }
	) format('woff2');
	font-weight: normal;
	font-style: normal;
}

/*
${ cssCodepoints }*/`;
	fs.writeFile( cssFile, cssContent, () => {} );

	// console.log('Wrote CSS file.');
};

// Make destination dir as needed.
fs.mkdirSync( destFontDir, { recursive: true } );

const codepoints = require( path.resolve( codepointsFile ) );
let maxCodepoint = Math.max( ...Object.values( codepoints ) );

let fontBuffer = Buffer.alloc( 0 );

const fontStream = new SVGIcons2SVGFontStream( {
	fontName: 'social-logos',
	descent: 0,
	normalize: true,
	fontHeight: 300,
	log: () => {}, // suppress default log messages
} );

fontStream
	.on( 'data', data => {
		// This concats to the font buffer each time a glyph is written.
		fontBuffer = Buffer.concat( [ fontBuffer, data ] );
	} )
	.on( 'finish', async function () {
		const woff2Buffer = await svg2woff2( fontBuffer );
		generateCSS( woff2Buffer );
		writeCodepoints();
		console.log( `Created font files in '${ destFontDir }'.` );
	} )
	.on( 'error', function ( err ) {
		throw err;
	} );

const files = glob.sync( svgDir + '/*.svg' );

// Sort for consistency.
files.sort();

files.forEach( file => {
	const glyph = fs.createReadStream( file );
	const glyphName = path.basename( file, '.svg' );
	const glyphUnicode = String.fromCharCode( getCodepoint( glyphName ) );
	glyph.metadata = {
		name: glyphName,
		unicode: [ glyphUnicode ],
	};
	// Trigger `data` event on font stream.
	fontStream.write( glyph );
} );
// Trigger `end` event on font stream.
fontStream.end();
