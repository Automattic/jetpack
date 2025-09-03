#!/usr/bin/env node

const path = require( 'path' );
const rcopy = require( 'recursive-copy' );

// eslint-disable-next-line no-undef
const dir = process.cwd();

const inputDir = path.join( dir, 'src' );
const outputDirESM = path.join( dir, 'dist', 'mjs' );
const outputDirCJS = path.join( dir, 'dist', 'cjs' );

const copyOptions = {
	overwrite: true,
	filter: [
		'**/*.gif',
		'**/*.jpg',
		'**/*.jpeg',
		'**/*.png',
		'**/*.svg',
		'**/*.scss',
		'!**/test/**',
	],
	concurrency: 127,
};

let copyAll = true;
let copyESM = false;
let copyCJS = false;

// eslint-disable-next-line no-undef
for ( const arg of process.argv.slice( 2 ) ) {
	if ( arg === '--esm' ) {
		copyAll = false;
		copyESM = true;
	}

	if ( arg === '--cjs' ) {
		copyAll = false;
		copyCJS = true;
	}
}

if ( copyAll || copyESM ) {
	rcopy( inputDir, outputDirESM, copyOptions );
}

if ( copyAll || copyCJS ) {
	rcopy( inputDir, outputDirCJS, copyOptions );
}
