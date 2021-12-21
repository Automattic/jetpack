#!/usr/bin/env node

const program = require( 'commander' );

program.command( 'mocha', 'run tests using mocha as runner', {
	isDefault: true,
	executableFile: 'mocha',
} );

program.parse( process.argv );
