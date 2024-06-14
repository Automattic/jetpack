#!/usr/bin/env node
/* eslint-disable no-console */
const svgDir = 'build/svg-clean';
const destReactDir = 'build/react';
const srcDataFile = 'src/react/social-logo-data.tsx';

const fs = require( 'fs' );
const path = require( 'path' );
const process = require( 'process' );
const { glob } = require( 'glob' );
const xml2js = require( 'xml2js' );

// Start in the right folder.
const rootDir = __dirname + '/..';
process.chdir( rootDir );

/**
 * Transforms kebab case names to camel case.
 * @param {string} name - e.g.: foo-bar-baz
 * @returns {string} e.g.: fooBarBaz
 */
function kebabToCamelCase( name ) {
	const KEBAB_REGEX = /-(\w)/g;
	return name.replace( KEBAB_REGEX, function replacer( match, capture ) {
		return capture.toUpperCase();
	} );
}

// Make destination dir as needed.
fs.mkdirSync( destReactDir, { recursive: true } );

let socialLogoData = `/** This is a generated file. Do not edit. */
export const SocialLogoData = [`;

const files = glob.sync( svgDir + '/*.svg' );

// Sort for consistency.
files.sort();

files.forEach( file => {
	// Get logo name from SVG file
	const logoName = path.basename( file, '.svg' );

	// Grab the relevant bits from the file contents
	let svgContent = fs.readFileSync( file );

	// Rename any attributes to camel case for react
	xml2js.parseString(
		svgContent,
		{
			async: false, // set callback is sync, since this task is sync
			trim: true,
			attrNameProcessors: [ kebabToCamelCase ],
		},
		function ( err, result ) {
			if ( err ) {
				throw err;
			} else {
				const builder = new xml2js.Builder( {
					renderOpts: { pretty: false },
					headless: true, //omit xml header
				} );
				svgContent = builder.buildObject( result );
			}
		}
	);

	socialLogoData += `
	{
		name: '${ logoName }',
		svg: ${ svgContent },
	},`;
} );
socialLogoData += '\n] as const;\n';

fs.writeFileSync( srcDataFile, socialLogoData );
console.log( `Created React SVG data file in '${ destReactDir }'.` );
