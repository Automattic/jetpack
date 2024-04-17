#!/usr/bin/env node
const svgDir = 'build/svg-clean';
const destReactDir = 'build/react';
const destDataFile = destReactDir + '/social-logo-data.jsx';

const fs = require( 'fs' );
const path = require( 'path' );
const process = require( 'process' );
const glob = require( 'glob' );
const xml2js = require( 'xml2js' );

// Start in the right folder.
const rootDir = __dirname + '/..';
process.chdir( rootDir );

/**
 * Transforms kebab case names to camel case
 * Legacy code with limited purpose.
 * @param name        - ex: foo-bar-baz
 * @returns {string}  ex: fooBarBaz
 */
function kebabToCamelCase( name ) {
	const KEBAB_REGEX = /\-(\w)/g;
	return name.replace( KEBAB_REGEX, function replacer( match, capture ) {
		return capture.toUpperCase();
	} );
}

// Make dir if it doesn't exist.
if ( ! fs.existsSync( destReactDir ) ) {
	fs.mkdirSync( destReactDir, { recursive: true } );
}

let socialLogoData = `/** This is a generated file. Do not edit. */
export const SocialLogoData = [`;

files = glob.sync( svgDir + '/*.svg' );

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
			if ( ! err ) {
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
socialLogoData += `
]`;

fs.writeFileSync( destDataFile, socialLogoData );
console.log( `Created React SVG data file in '${ destReactDir }'.` );
