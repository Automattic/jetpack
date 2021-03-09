#!/usr/bin/env node

/**
 * External dependencies
 */
import Mocha from 'mocha';
import glob from 'glob';
import path from 'path';
import process from 'process';
import parser from 'yargs-parser';

process.chdir( path.join( __dirname, '../../..' ) );

const args = {
	type: parser( process.argv.slice( 2 ) ).type || false,
};

let pattern;

switch ( args.type ) {
	case 'unit':
		pattern = 'tools/cli/tests/unit/**/*.test.js';
		break;
	case 'integration':
		pattern = 'tools/cli/tests/integration/**/*.test.js';
		break;
	case 'all':
	default:
		pattern = 'tools/cli/tests/**/*.test.js';
}

const mochaRunner = new Mocha();

glob.sync( pattern ).forEach( file => {
	mochaRunner.addFile( file );
} );

mochaRunner.run( function ( failures ) {
	process.on( 'exit', function () {
		process.exit( failures ); //eslint-disable-line no-process-exit
	} );
} );
