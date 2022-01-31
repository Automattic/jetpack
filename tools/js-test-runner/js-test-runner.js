#!/usr/bin/env node

const program = require( 'commander' );

program
	.command( 'mocha', 'run tests using mocha as runner', {
		isDefault: true,
		executableFile: 'mocha',
	} )
	.command( 'jest', 'run tests using jest as runner', { executableFile: 'jest' } );

program.parse( process.argv );
