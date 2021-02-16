/**
 * External dependencies
 */
import chai from 'chai';
import path from 'path';
import fs from 'fs';

/**
 * Internal dependencies
 */
import mergeDirs from '../../../helpers/mergeDirs';

const dataDir = path.join( __dirname, '../../data/' );
const sourceDir = path.join( dataDir, 'source/' );
const destDir = path.join( dataDir, 'dest/' );

// Reset test directories before running anything in the event of some left from earlier.
before( function () {
	try {
		fs.rmdirSync( destDir, { recursive: true } );
	} catch ( e ) {
		console.log( 'Deletion of previous tests failed: ' + e.message );
	}
} );

// Reset after each test to ensure clean merge testing.
afterEach( function () {
	try {
		fs.rmdirSync( destDir, { recursive: true } );
	} catch ( e ) {
		console.log( 'Deletion of previous test failed: ' + e.message );
	}
} );

describe( 'mergeDirs', function () {
	it( 'should be a function', function () {
		chai.expect( mergeDirs ).to.be.an( 'function' );
	} );

	it( 'should fail when both a src and dist is not passed', function () {
		chai
			.expect( function () {
				mergeDirs();
			} )
			.to.throw( Error );
	} );

	it( 'should copy directory to a new location', function () {
		mergeDirs( sourceDir, destDir );
		chai.expect( fs.existsSync( dataDir + 'source/source.md' ) ).to.be.true;
	} );
} );
