const path = require( 'path' );
const program = require( 'commander' );
const { run } = require( 'jest' );

process.env.NODE_ENV = 'test';

program.allowUnknownOption();
program.parse( process.argv );

const config = path.join( __dirname, './jest-config/jest.config.js' );
const args = [ ...program.args, '--config', config ];

/* eslint-disable no-console */
run( args )
	.then( value => console.log( value ) )
	.catch( error => console.error( error ) );
/* eslint-enable no-console */
