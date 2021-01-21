#!/usr/bin/env node

/**
 * External dependencies
 */
import Mocha from 'mocha';
import glob from 'glob';
import path from 'path';
import process from 'process';

process.chdir( path.join( __dirname, '../../..' ) );

const mochaRunner = new Mocha();

glob.sync( 'tools/cli/**/*.test.js' ).forEach( file => {
	mochaRunner.addFile( file );
} );

mochaRunner.run( function ( failures ) {
	process.on( 'exit', function () {
		process.exit( failures ); //eslint-disable-line no-process-exit
	} );
} );
