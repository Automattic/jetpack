#!/usr/bin/env node

require( '@babel/register' );

const program = require( 'commander' ),
	glob = require( 'glob' ),
	Mocha = require( 'mocha' ),
	boot = require( './boot-test' );

program
	.usage( '[options] [files]' )
	.option( '-R, --reporter <name>', 'specify the reporter to use', 'spec' )
	.option( '-g, --grep <pattern>', 'only run tests matching <pattern>' );

program.name = 'runner';

program.parse( process.argv );

const mocha = new Mocha( {
	ui: 'bdd',
	reporter: program.reporter,
} );

if ( program.grep ) {
	mocha.grep( new RegExp( program.grep ) );
}

mocha.suite.beforeAll( boot.before );
mocha.suite.afterAll( boot.after );

if ( program.args.length ) {
	// Test interface components
	if ( 1 === program.args.length ) {
		// Don't load styles for testing
		require.extensions[ '.scss' ] = () => false;
		require.extensions[ '.css' ] = require.extensions[ '.scss' ];

		// Define a dom so we can have window and all else
		require( 'jsdom-global' )();

		window.Initial_State = {
			userData: {},
			dismissedNotices: {},
			locale: '{}',
			licensing: { error: '' },
		};

		switch ( program.args[ 0 ] ) {
			case 'gui':
				mocha.addFile( '_inc/client/test/main.js' );

				glob.sync( '_inc/client/**/test/component.js' ).forEach( file => {
					mocha.addFile( file );
				} );
				break;
			case 'modules':
				glob.sync( 'modules/**/test-*.js' ).forEach( file => {
					mocha.addFile( file );
				} );
				break;
		}
	} else {
		program.args.forEach( function ( file ) {
			mocha.addFile( file );
		} );
	}
} else {
	glob.sync( '_inc/client/state/**/test/*.js' ).forEach( file => {
		mocha.addFile( file );
	} );
}

mocha.run( function ( failures ) {
	process.on( 'exit', function () {
		process.exit( failures ); //eslint-disable-line no-process-exit
	} );
} );
