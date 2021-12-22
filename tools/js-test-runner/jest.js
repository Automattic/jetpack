const { run } = require( 'jest' );
const program = require( 'commander' );
const path = require( 'path' );

program.option( '--config <file>', 'some custom config that will override default config' );
program.allowUnknownOption();
program.parse( process.argv );

const options = program.opts();
const defaultConfig = path.join( __dirname, './jest-config/jest.config.js' );
const config = options.config || defaultConfig;
const args = [ ...program.args, '--config', config ];

/* eslint-disable no-console */
run( args )
	.then( value => console.log( value ) )
	.catch( error => console.error( error ) );
/* eslint-enable no-console */
