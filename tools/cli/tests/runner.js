#!/usr/bin/env node

/**
 * External dependencies
 */
import Mocha from 'mocha';
import glob from 'glob';
import process from 'process';
import parser from 'yargs-parser';
import { fileURLToPath } from 'url';

process.chdir( fileURLToPath( new URL( '../../..', import.meta.url ) ) );

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

await mochaRunner.loadFilesAsync();
mochaRunner.run( function ( failures ) {
	process.on( 'exit', function () {
		process.exit( failures ); //eslint-disable-line no-process-exit
	} );
} );
