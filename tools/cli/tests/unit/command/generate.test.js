/**
 * TEMPORARY TESTS DURING DEVELOPMENT. Not sure best way to unit test a function that we don't want to export...
 */

/**
 * External dependencies
 */
import chai from 'chai';
import path from 'path';
import fs from 'fs';

/**
 * Internal dependencies
 */
import { generatePackage } from '../../../commands/generate';
import { readPackageJson } from '../../../helpers/json';

const monoRoot = path.join( __dirname, '../../../../../' );
const destPkg = monoRoot + 'projects/packages/test/';

// Reset test directories before running anything in the event of some left from earlier.
before( function () {
	try {
		fs.rmdirSync( destPkg, { recursive: true } );
	} catch ( e ) {
		console.log( 'Deletion of previous tests failed: ' + e.message );
	}
} );

// Reset after tests to ensure clean merge testing.
after( function () {
	try {
		fs.rmdirSync( destPkg, { recursive: true } );
	} catch ( e ) {
		console.log( 'Deletion of previous test failed: ' + e.message );
	}
} );

describe( 'GENERATE TESTS', function () {
	it( 'should be a function', function () {
		chai.expect( generatePackage ).to.be.an( 'function' );
	} );

	it( 'should copy directories to a new location', function () {
		const output = generatePackage( { name: 'test', description: 'Changed.' } );
		// From the common skeleton.
		chai.expect( fs.existsSync( monoRoot + 'projects/packages/test/package.json' ) ).to.be.true;
		// From the packages skeleton.
		chai.expect( fs.existsSync( monoRoot + 'projects/packages/test/phpunit.xml.dist' ) ).to.be.true;
		chai.expect( output.description ).to.contain( 'Changed.' );
		const packageJson = readPackageJson( 'packages/test' );
		chai.expect( packageJson.description ).to.contain( 'Changed.' );
	} );
} );
