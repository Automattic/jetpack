#!/usr/bin/env node

// React <17.1 is broken on Node 16 when jsdom is used. This hacks around the bug.
// See https://github.com/facebook/react/issues/20756#issuecomment-780927519
// (but note the package they recommend there is itself broken, sigh)
// @todo Remove this when we update to React 17.1.
delete global.MessageChannel;

// No-op various extensions that things might be trying to load but we can't test.
const noop = () => false;
require.extensions[ '.css' ] = noop;
require.extensions[ '.scss' ] = noop;
require.extensions[ '.svg' ] = noop;
require.extensions[ '.jpg' ] = noop;
require.extensions[ '.png' ] = noop;

const path = require( 'path' );
const basepath = path.dirname( path.dirname( __dirname ) );
require( '@babel/register' )( {
	ignore: [ /node_modules/ ],
	only: [
		function ( filepath ) {
			return filepath.startsWith( basepath );
		},
	],
	presets: [
		require.resolve( '@babel/preset-react' ),
		[ require.resolve( '@babel/preset-env' ), { targets: { node: 'current' } } ],
	],
	plugins: [ require.resolve( '@babel/plugin-transform-runtime' ) ],
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

program.parse( process.argv );
const options = program.opts();

const mocha = new Mocha( {
	ui: 'bdd',
	reporter: options.reporter,
} );

if ( options.grep ) {
	mocha.grep( new RegExp( options.grep ) );
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

if ( options.jsdom ) {
	// Define a dom so we can have window and all else
	require( 'global-jsdom' )();

	// Mock CSS Object Model, used in @wordpress/components (not even via `window`) without first testing that it exists.
	// https://developer.mozilla.org/en-US/docs/Web/API/CSS
	if ( ! global.CSS ) {
		global.CSS = {
			escape: () => false,
			supports: () => false,
		};
	}
}

if ( options.initfile ) {
	mocha.addFile( options.initfile );
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
	glob.sync( './!(node_modules)/**/test/*.{js,jsx,cjs,mjs,ts,tsx}' ).forEach( file => {
		mocha.addFile( file );
	} );
}

mocha.run( function ( failures ) {
	process.on( 'exit', function () {
		process.exit( failures ); //eslint-disable-line no-process-exit
	} );
} );
