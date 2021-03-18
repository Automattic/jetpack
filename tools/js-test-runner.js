#!/usr/bin/env node

// No-op various extensions that things might be trying to load but we can't test.
const noop = () => false;
require.extensions[ '.css' ] = noop;
require.extensions[ '.scss' ] = noop;
require.extensions[ '.svg' ] = noop;

const basepath = require( 'path' ).dirname( __dirname );
require( '@babel/register' )( {
	ignore: [ /node_modules/ ],
	only: [
		function ( path ) {
			return path.startsWith( basepath );
		},
	],
	presets: [ '@babel/preset-react', [ '@babel/preset-env', { targets: { node: 'current' } } ] ],
	plugins: [ '@babel/plugin-transform-runtime' ],
} );

const program = require( 'commander' ),
	glob = require( 'glob' ),
	Mocha = require( 'mocha' ),
	Chai = require( 'chai' ),
	sinonChai = require( 'sinon-chai' ),
	sinon = require( 'sinon' ),
	nock = require( 'nock' );

program
	.usage( '[options] [files]' )
	.option( '--initfile <file>', 'add the named file to mocha before the test files' )
	.option( '--jsdom', 'register window and other dom objects' )
	.option( '-R, --reporter <name>', 'specify the reporter to use', 'spec' )
	.option( '-g, --grep <pattern>', 'only run tests matching <pattern>' );

program.name = 'js-test-runner';

program.parse( process.argv );

const mocha = new Mocha( {
	ui: 'bdd',
	reporter: program.reporter,
} );

if ( program.grep ) {
	mocha.grep( new RegExp( program.grep ) );
}

mocha.suite.beforeAll( function () {
	Chai.use( sinonChai );
	sinon.assert.expose( Chai.assert, { prefix: '' } );
	nock.disableNetConnect();
} );
mocha.suite.afterAll( function () {
	nock.cleanAll();
	nock.enableNetConnect();
	nock.restore();
} );

if ( program.jsdom ) {
	// Define a dom so we can have window and all else
	require( 'jsdom-global' )();

	window.Initial_State = {
		userData: {},
		dismissedNotices: {},
		locale: '{}',
		licensing: { error: '' },
	};
}

if ( program.initfile ) {
	mocha.addFile( program.initfile );
}

if ( program.args.length ) {
	program.args.forEach( function ( file ) {
		if ( file.startsWith( 'glob:' ) ) {
			glob.sync( file.substring( 5 ) ).forEach( file2 => {
				mocha.addFile( file2 );
			} );
		} else {
			mocha.addFile( file );
		}
	} );
} else {
	glob.sync( './!(node_modules)/**/test/*.{js,jsx}' ).forEach( file => {
		mocha.addFile( file );
	} );
}

mocha.run( function ( failures ) {
	process.on( 'exit', function () {
		process.exit( failures ); //eslint-disable-line no-process-exit
	} );
} );
