#!/usr/bin/env node
require( 'babel-register' )( {
        ignore: /\/node_modules\/(?!@automattic\/dops-components\/)/
} );

const program = require( 'commander' ),
	Mocha = require( 'mocha' ),
	path = require( 'path' ),
	boot = require( './boot-test' );

program
	.usage( '[options] [files]' )
	.option( '-R, --reporter <name>', 'specify the reporter to use', 'spec' )
	.option( '-g, --grep <pattern>', 'only run tests matching <pattern>' );

program.name = 'runner';

program.parse( process.argv );

const mocha = new Mocha( {
	ui: 'bdd',
	reporter: program.reporter
} );

if ( program.grep ) {
	mocha.grep( new RegExp( program.grep ) );
}

mocha.suite.beforeAll( boot.before );
mocha.suite.afterAll( boot.after );

// we could also discover all the tests using a glob?
if ( program.args.length ) {

	// Test interface components
	if ( 1 === program.args.length && 'gui' === program.args[0] ) {
		// Fixes error "@import unexpected token"
		require.extensions['.scss'] = () => false;
		require.extensions['.css'] = require.extensions['.scss'];

		// Fixes error "window is not defined"
		require('jsdom-global')();

		mocha.addFile( path.join( __dirname, 'load-suite-gui.js' ) );
	} else {
		program.args.forEach( function( file ) {
			mocha.addFile( file );
		} );
	}
} else {
	mocha.addFile( path.join( __dirname, 'load-suite.js' ) );
}

mocha.run( function( failures ) {
	process.on( 'exit', function() {
		process.exit( failures ); //eslint-disable-line no-process-exit
	} );
} );
