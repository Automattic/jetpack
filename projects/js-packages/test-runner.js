#!/usr/bin/env node
require( '@babel/register' );

const program = require( 'commander' ),
	glob = require( 'glob' ),
	Mocha = require( 'mocha' ),
	Chai = require( 'chai' ),
	sinonChai = require( 'sinon-chai' ),
	sinon = require( 'sinon' ),
	nock = require( 'nock' );

program.name = 'rna-test-runner';

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

require.extensions[ '.scss' ] = () => false;

mocha.addFile( 'test-init.js' );

if ( program.args.length ) {
	program.args.forEach( function ( file ) {
		mocha.addFile( file );
	} );
} else {
	glob.sync( './!(node_modules)/**/test/*.jsx' ).forEach( file => {
		mocha.addFile( file );
	} );
}

mocha.run( function ( failures ) {
	process.on( 'exit', function () {
		process.exit( failures ); //eslint-disable-line no-process-exit
	} );
} );
