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

// Reset test directories before running anything in the event of some left from earlier.
before( function () {
	fs.rmSync( path.join( dataDir, 'dest' ), { force: true, recursive: true } );
	fs.rmSync( path.join( dataDir, 'source/copy.md' ), { force: true } );
} );

// Reset after each test to ensure clean merge testing.
afterEach( function () {
	fs.rmSync( path.join( dataDir, 'dest' ), { force: true, recursive: true } );
	fs.rmSync( path.join( dataDir, 'source/copy.md' ), { force: true } );
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

	it( 'should fail when both a src and dist is not passed', function () {
		chai
			.expect( function () {
				mergeDirs();
			} )
			.to.throw( Error );
	} );

	// dataDir + 'source', dataDir + 'dest'
} );
