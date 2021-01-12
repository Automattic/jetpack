#!/usr/bin/env node

/**
 * External dependencies
 */
import Mocha from 'mocha';
import glob from 'glob';

const mochaRunner = new Mocha();

glob.sync( 'tools/cli/**/*.test.js' ).forEach( file => {
	mochaRunner.addFile( file );
} );

mocha.run( function ( failures ) {
	process.on( 'exit', function () {
		process.exit( failures ); //eslint-disable-line no-process-exit
	} );
} );
